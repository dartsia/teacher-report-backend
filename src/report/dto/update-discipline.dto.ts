import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateDisciplineDto {
  @ApiProperty({ example: 'Бази даних', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'Електроніки та комп\'ютерних технологій', required: false })
  @IsString()
  @IsOptional()
  faculty?: string;

  @ApiProperty({ example: 'Ел. 121-2', required: false })
  @IsString()
  @IsOptional()
  specialty?: string;

  @ApiProperty({ example: 2, required: false })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  course?: number;

  @ApiProperty({ example: 1, required: false })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  semester?: number;

  @ApiProperty({ example: 'FULL_TIME', enum: ['FULL_TIME', 'PART_TIME'], required: false })
  @IsString()
  @IsOptional()
  studyForm?: 'FULL_TIME' | 'PART_TIME';

  @ApiProperty({ example: 65, required: false })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  studentsCount?: number;

  @ApiProperty({ example: 32, required: false })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  lectures?: number;

  @ApiProperty({ example: 0, required: false })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  practicals?: number;

  @ApiProperty({ example: 6, required: false })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  labs?: number;

  @ApiProperty({ example: 15, required: false })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  consultations?: number;

  @ApiProperty({ example: 0, required: false })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  exams?: number;

  @ApiProperty({ example: 0, required: false })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  credits?: number;

  @ApiProperty({ example: 0, required: false })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  controlWorks?: number;

  @ApiProperty({ example: 0, required: false })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  courseWorks?: number;

  @ApiProperty({ example: 0, required: false })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  thesisWorks?: number;
}