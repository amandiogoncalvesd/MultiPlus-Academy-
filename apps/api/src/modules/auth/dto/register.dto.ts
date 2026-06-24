import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: "O primeiro nome é obrigatório." })
  firstName: string;

  @IsString()
  @IsNotEmpty({ message: "O apelido é obrigatório." })
  lastName: string;

  @IsEmail({}, { message: "Por favor, insira um endereço de e-mail válido." })
  @IsNotEmpty({ message: "O e-mail é obrigatório." })
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @MinLength(6, { message: "A senha deve ter pelo menos 6 caracteres." })
  @IsNotEmpty({ message: "A senha é obrigatória." })
  password: string;
}
