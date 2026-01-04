import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { ReportService } from './report.service';
import { UpdateDisciplineDto } from './dto/update-discipline.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get()
  async getAllReports(@CurrentUser('id') userId: string) {
    return this.reportService.getAllReports(userId);
  }

  @Get(':id')
  async getReport(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.reportService.getReport(id, userId);
  }

  @Get(':id/disciplines')
  async getDisciplines(
    @Param('id') reportId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.reportService.getDisciplines(reportId, userId);
  }

  @Put('disciplines/:id')
  async updateDiscipline(
    @Param('id') id: string,
    @Body() data: UpdateDisciplineDto,
    @CurrentUser('id') userId: string,
  ) {
    console.log('Received request to update discipline:', id, 'with data:', data, 'by user:', userId);
    return this.reportService.updateDiscipline(id, data, userId);
  }

  @Delete('disciplines/:id')
  async deleteDiscipline(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.reportService.deleteDiscipline(id, userId);
  }

  @Post(':id/disciplines')
  async addDiscipline(
    @Param('id') reportId: string,
    @Body() data: UpdateDisciplineDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.reportService.addDiscipline(reportId, data, userId);
  }

  @Post(':id/validate')
  async validateReport(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.reportService.validateReport(id, userId);
  }

  @Post(':id/complete')
  async completeReport(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.reportService.completeReport(id, userId);
  }

  @Get(':id/export/pdf')
  async exportToPdf(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.reportService.exportToPdf(id, userId);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=report-${id}.pdf`,
      'Content-Length': pdfBuffer.length,
    });
    
    res.end(pdfBuffer);
  }

  @Get(':id/export/excel')
  async exportToExcel(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Res() res: Response,
  ) {
    const excelBuffer = await this.reportService.exportToExcel(id, userId);
    
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=report-${id}.xlsx`,
      'Content-Length': excelBuffer.length,
    });
    
    res.end(excelBuffer);
  }

  @Delete(':id')
  async deleteReport(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.reportService.deleteReport(id, userId);
  }
}