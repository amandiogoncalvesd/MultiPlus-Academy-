import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-custom";
import { Request } from "express";
import { AuthService } from "../auth.service";
import * as admin from "firebase-admin";

@Injectable()
export class FirebaseStrategy extends PassportStrategy(Strategy, "firebase") {
  constructor(private readonly authService: AuthService) {
    super();
  }

  async validate(req: Request): Promise<any> {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException("Token de autenticação ausente ou malformado.");
    }

    const token = authHeader.split("Bearer ")[1];
    if (!token) {
      throw new UnauthorizedException("Token de autenticação não fornecido.");
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      const user = await this.authService.validateFirebaseUser(decodedToken.uid);
      return user;
    } catch (error: any) {
      throw new UnauthorizedException(`Sessão expirada ou token inválido: ${error.message}`);
    }
  }
}
