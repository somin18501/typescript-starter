import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateReportDto } from 'src/reports/dtos/create-report.dto';
import { GetEstimateDto } from 'src/reports/dtos/get-estimate.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Report, ReportWithUser } from 'src/reports/report.model';
import { User } from 'src/users/user.model';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  create(reportDto: CreateReportDto, user: User): Promise<ReportWithUser> {
    return this.prisma.report.create({
      data: {
        ...reportDto,
        user: {
          connect: { id: user.id },
        },
      },
      include: {
        user: true,
      },
    });
  }

  async changeApproval(id: number, approved: boolean): Promise<Report> {
    const report = await this.prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return this.prisma.report.update({
      where: { id },
      data: { approved },
    });
  }

  async createEstimate({
    make,
    model,
    year,
    lng,
    lat,
    mileage,
  }: GetEstimateDto): Promise<{ price: number | null }> {
    const matchingReports = await this.prisma.report.findMany({
      where: {
        make,
        model,
        approved: true,
        lng: {
          gte: lng - 5,
          lte: lng + 5,
        },
        lat: {
          gte: lat - 5,
          lte: lat + 5,
        },
        year: {
          gte: year - 3,
          lte: year + 3,
        },
      },
      select: {
        price: true,
        mileage: true,
      },
    });

    const nearestReports = matchingReports
      .sort(
        (first, second) =>
          Math.abs(first.mileage - mileage) - Math.abs(second.mileage - mileage),
      )
      .slice(0, 3);

    if (nearestReports.length === 0) {
      return { price: null };
    }

    const averagePrice =
      nearestReports.reduce((sum, report) => sum + report.price, 0) /
      nearestReports.length;

    return { price: averagePrice };
  }
}
