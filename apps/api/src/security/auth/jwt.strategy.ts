import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-custom";
import { Request } from "express";
import * as jwt from "jsonwebtoken";
import { AuthenticatedUser } from "./auth.guard";

@Injectable()
export class SupabaseJwtStrategy extends PassportStrategy(Strategy, "supabase-jwt") {
  constructor() {
    super();
  }

  async validate(req: Request): Promise<AuthenticatedUser> {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException("Token de autenticação ausente ou malformado.");
    }

    const token = authHeader.split("Bearer ")[1];
    if (!token) {
      throw new UnauthorizedException("Token de autenticação não fornecido.");
    }

    try {
      const jwtSecret = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET || 'supabase-jwt-secret-placeholder-minimum-32-characters-long';
      const payload = jwt.verify(token, jwtSecret) as any;

      if (!payload) {
        throw new UnauthorizedException("Token inválido ou sem payload.");
      }

      let rawRole = payload.role || payload.user_metadata?.role || "student";
      rawRole = rawRole.toLowerCase();

      let mappedRole: "admin" | "teacher" | "student" | "parent" = "student";
      if (rawRole.includes("admin") || rawRole === "super_admin") {
        mappedRole = "admin";
      } else if (rawRole === "teacher" || rawRole === "professor") {
        mappedRole = "teacher";
      } else if (rawRole === "student" || rawRole === "aluno") {
        mappedRole = "student";
      } else if (rawRole === "parent") {
        mappedRole = "parent";
      }

      const schoolId = payload.school_id || payload.user_metadata?.school_id || "default-school-id";

      return {
        id: payload.sub || payload.user_id || payload.id,
        email: payload.email,
        role: mappedRole,
        school_id: schoolId,
      };
    } catch (error: any) {
      throw new UnauthorizedException(`Sessão expirada ou token de assinatura inválido: ${error.message}`);
    }
  }
}
