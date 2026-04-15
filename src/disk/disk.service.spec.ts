import { Test, TestingModule } from '@nestjs/testing';
import { PowerService } from 'src/power/power.service';
import { DiskService } from './disk.service';

describe('DiskService', () => {
  let service: DiskService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiskService,
        {
          provide: PowerService,
          useValue: { supplyPower: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<DiskService>(DiskService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
