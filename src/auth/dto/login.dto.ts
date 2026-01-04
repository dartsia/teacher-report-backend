import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'teacher@university.ua' })
  @IsEmail({}, { message: 'Невірний формат email' })
  email: string;

  @ApiProperty({ example: 'securePassword123' })
  @IsString()
  password: string;
}