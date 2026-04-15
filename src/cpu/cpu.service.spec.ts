import { Test, TestingModule } from '@nestjs/testing';
import { PowerService } from 'src/power/power.service';
import { CpuService } from './cpu.service';

describe('CpuService', () => {
  let service: CpuService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CpuService,
        {
          provide: PowerService,
          useValue: { supplyPower: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<CpuService>(CpuService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
