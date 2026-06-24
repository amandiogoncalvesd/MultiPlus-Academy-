import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { FirebaseStrategy } from "./strategies/firebase.strategy";
import { PrismaService } from "../../prisma/prisma.service";

@Module({
  imports: [PassportModule.register({ defaultStrategy: "firebase" })],
  controllers: [AuthController],
  providers: [AuthService, FirebaseStrategy, PrismaService],
  exports: [AuthService, PassportModule],
})
export class AuthModule {}
