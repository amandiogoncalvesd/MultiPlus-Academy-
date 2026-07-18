import { Injectable, ConflictException, InternalServerErrorException, UnauthorizedException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { UserRole, UserStatus } from "@prisma/client";
import * as admin from "firebase-admin";

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(registerDto: RegisterDto) {
    const { email, password, firstName, lastName, phone } = registerDto;

    // 1. Validar se o e-mail solicitado já existe no PostgreSQL
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException("O e-mail indicado já se encontra registado no sistema.");
    }

    let firebaseUser: admin.auth.UserRecord;

    try {
      // 2. Criar utilizador no Firebase Authentication
      firebaseUser = await admin.auth().createUser({
        email,
        password,
        displayName: `${firstName} ${lastName}`,
        phoneNumber: phone || undefined,
        disabled: false,
      });

      // Definir custom claim para roles no Firebase Token
      await admin.auth().setCustomUserClaims(firebaseUser.uid, { role: UserRole.ALUNO });
    } catch (error: any) {
      throw new ConflictException(`Erro de provisionamento no Firebase Auth: ${error.message}`);
    }

    try {
      // 3. Persistir utilizador no banco relacional PostgreSQL associando o UID como id
      const dbUser = await this.prisma.user.create({
        data: {
          id: firebaseUser.uid,
          firstName,
          lastName,
          email,
          phone: phone || null,
          role: UserRole.ALUNO,
          status: UserStatus.ACTIVE,
        },
      });

      return dbUser;
    } catch (error: any) {
      // Rollback no Firebase se falhar na persistência do PostgreSQL
      await admin.auth().deleteUser(firebaseUser.uid);
      throw new InternalServerErrorException(
        `Falha de integridade na sincronização PostgreSQL. Revertendo registo de Firebase. Erro: ${error.message}`
      );
    }
  }

  async login(loginDto: LoginDto) {
    const { idToken, email } = loginDto;

    let uid: string | undefined;
    let targetEmail = email;

    if (idToken) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        uid = decodedToken.uid;
        targetEmail = decodedToken.email;
      } catch (error: any) {
        throw new UnauthorizedException(`Token do Firebase inválido ou expirado: ${error.message}`);
      }
    }

    if (!uid && !targetEmail) {
      throw new UnauthorizedException("É necessário fornecer um idToken válido ou o e-mail do utilizador.");
    }

    // Procura o utilizador
    const user = await this.prisma.user.findFirst({
      where: uid ? { id: uid } : { email: targetEmail },
    });

    if (!user) {
      throw new UnauthorizedException("Nenhum registo de utilizador correspondente encontrado no sistema.");
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException("O acesso desta conta foi temporariamente suspenso.");
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException("Esta conta está desativada. Por favor contacte o suporte pedagógico.");
    }

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
      },
      role: user.role,
      status: user.status,
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    // Verificar se existe cadastrado no postgres
    const dbUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!dbUser) {
      throw new NotFoundException("Não foi encontrado nenhum utilizador com o e-mail fornecido.");
    }

    try {
      // SECURITY: Generate the reset link but NEVER return it in the response.
      // Firebase automatically sends the reset email to the user.
      // The link must only be accessible via the user's email inbox.
      await admin.auth().generatePasswordResetLink(email);
      
      return {
        success: true,
        message: "Se o e-mail estiver registado, um link de redefinição foi enviado para a sua caixa de correio.",
      };
    } catch (error: any) {
      throw new InternalServerErrorException(`Erro ao processar recuperação no Firebase: ${error.message}`);
    }
  }

  async validateFirebaseUser(uid: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: uid },
    });

    if (!user) {
      throw new UnauthorizedException("Sessão inválida. O utilizador não consta no ecossistema.");
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException("Utilizador suspenso. Acesso negado.");
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException("Utilizador inativo. Acesso negado.");
    }

    return user;
  }
}
