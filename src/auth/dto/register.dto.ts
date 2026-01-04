import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'teacher@university.ua' })
  @IsEmail({}, { message: 'Невірний формат email' })
  email: string;

  @ApiProperty({ example: 'securePassword123' })
  @IsString()
  @MinLength(8, { message: 'Пароль має бути не менше 8 символів' })
  password: string;

  @ApiProperty({ example: 'Гусак Олег' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Асистент', required: false })
  @IsString()
  @IsOptional()
  position?: string;

  @ApiProperty({ example: 'Кафедра системного проектування', required: false })
  @IsString()
  @IsOptional()
  department?: string;
}