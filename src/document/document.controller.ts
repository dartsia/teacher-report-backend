import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
// import { diskStorage } from 'multer';
// import { extname } from 'path';
import { DocumentService } from './document.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { Express } from 'express';

@ApiTags('documents')
@Controller('documents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        academicYear: {
          type: 'string',
          example: '2025/2026',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      // storage: diskStorage({
      //   destination: './uploads',
      //   filename: (req, file, cb) => {
      //     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      //     cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
      //   },
      // }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(pdf|doc|docx)$/)) {
          return cb(new BadRequestException('Тільки PDF або Word файли!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body('academicYear') academicYear: string,
    @CurrentUser('id') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('Файл не завантажено');
    }

    if (!academicYear) {
      throw new BadRequestException('Навчальний рік обов\'язковий');
    }

    return this.documentService.processDocument(file, userId, academicYear);
  }

  
  @Post('parse')
  //@ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reportId: {
          type: 'string',
          example: '61942e4e-32b2-4ab4-bdcd-48d3534b6c6d',
        },
      },
    },
  })
  async parseDocument(@Body('reportId') reportId: string) {
    if (!reportId) {
      throw new BadRequestException('reportId обов\'язковий');
    }

    return this.documentService.parseDocument(reportId);
  }
}