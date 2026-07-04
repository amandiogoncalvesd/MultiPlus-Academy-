import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateCourseDto {
  @IsString({ message: 'O título do curso deve ser uma cadeia de caracteres válida.' })
  @IsNotEmpty({ message: 'O título do curso não pode estar vazio.' })
  title: string;

  @IsString({ message: 'A descrição deve ser um texto válido.' })
  @IsNotEmpty({ message: 'A descrição do curso é obrigatória.' })
  description: string;

  @IsString({ message: 'A categoria deve ser informada.' })
  @IsNotEmpty({ message: 'A categoria do curso é obrigatória.' })
  category: string;

  @IsNumber({}, { message: 'O preço deve ser um valor numérico.' })
  @Min(0, { message: 'O preço não pode ser inferior a 0.' })
  price: number;

  @IsString({ message: 'A duração deve ser informada.' })
  @IsNotEmpty({ message: 'A duração estimada do curso é obrigatória.' })
  duration: string;

  @IsString({ message: 'O nível deve ser uma das categorias predefinidas.' })
  @IsOptional()
  level?: string;
}
