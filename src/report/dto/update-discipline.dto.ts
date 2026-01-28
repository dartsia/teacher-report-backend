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

  @ApiProperty({ example: '121', required: false })
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

  @ApiProperty({ example: 65, required: false })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  students?: number;

  @ApiProperty({ example: 32, required: false })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  lecturesFullTime?: number;

  @ApiProperty({ example: 4, required: false })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  lecturesPartTime?: number;

  @ApiProperty({ example: 16, required: false })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  practicalsFullTime?: number;

  @ApiProperty({ example: 2, required: false })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  practicalsPartTime?: number;

  @ApiProperty({ example: 16, required: false })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  labsFullTime?: number;

  @ApiProperty({ example: 0, required: false })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  labsPartTime?: number;

  @ApiProperty({ example: 4, required: false })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  consultationsFullTime?: number;

  @ApiProperty({ example: 2, required: false })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  consultationsPartTime?: number;

  @ApiProperty({ example: 2, required: false })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  examsFullTime?: number;

  @ApiProperty({ example: 2, required: false })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  examsPartTime?: number;

  @ApiProperty({ example: 2, required: false })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  creditsFullTime?: number;

  @ApiProperty({ example: 0, required: false })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  creditsPartTime?: number;

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