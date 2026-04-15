import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from 'src/guards/admin.guard';
import { AuthGuard } from 'src/guards/auth.guard';
import { Serialize } from 'src/interceptors/serialize.interceptor';
import { ApproveReportDto } from 'src/reports/dtos/approve-report.dto';
import { CreateReportDto } from 'src/reports/dtos/create-report.dto';
import { GetEstimateDto } from 'src/reports/dtos/get-estimate.dto';
import { ReportOutputDto } from 'src/reports/dtos/report-output.dto';
import { ReportsService } from 'src/reports/reports.service';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import type { User } from 'src/users/user.model';

@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Post('/create')
  @UseGuards(AuthGuard)
  @Serialize(ReportOutputDto)
  createReport(@Body() reportDto: CreateReportDto, @CurrentUser() user: User) {
    return this.reportsService.create(reportDto, user);
  }

  @Patch('/:id')
  @UseGuards(AdminGuard)
  approveReport(@Param('id') id: string, @Body() body: ApproveReportDto) {
    return this.reportsService.changeApproval(parseInt(id), body.approved);
  }

  @Get()
  getEstimate(@Query() query: GetEstimateDto) {
    return this.reportsService.createEstimate(query);
  }
}
