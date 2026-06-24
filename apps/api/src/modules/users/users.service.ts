import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import * as admin from "firebase-admin";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException("O utilizador solicitado não foi encontrado.");
    }
    return user;
  }

  async updateProfile(id: string, updateProfileDto: UpdateProfileDto) {
    // 1. Atualizar no PostgreSQL relacional
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        firstName: updateProfileDto.firstName,
        lastName: updateProfileDto.lastName,
        phone: updateProfileDto.phone,
        avatar: updateProfileDto.avatar,
      },
    });

    // 2. Sincronizar com o Firebase Admin Authentication metadata
    try {
      const displayNameConcat = [updatedUser.firstName, updatedUser.lastName]
        .filter(Boolean)
        .join(" ");

      await admin.auth().updateUser(id, {
        displayName: displayNameConcat || undefined,
        photoURL: updatedUser.avatar || undefined,
      });
    } catch (fbError: any) {
      console.warn(`Erro secundário ao sincronizar metadados para o Firebase: ${fbError.message}`);
    }

    return updatedUser;
  }
}
