import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class LoginDto {
  @IsString()
  @IsOptional()
  idToken?: string;

  @IsEmail({}, { message: "Por favor, insira um e-mail válido." })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  password?: string;
}
