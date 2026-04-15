import { Test, TestingModule } from '@nestjs/testing';
import { CpuService } from 'src/cpu/cpu.service';
import { DiskService } from 'src/disk/disk.service';
import { ComputerController } from './computer.controller';

describe('ComputerController', () => {
  let controller: ComputerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ComputerController],
      providers: [
        {
          provide: CpuService,
          useValue: { compute: jest.fn() },
        },
        {
          provide: DiskService,
          useValue: { getData: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<ComputerController>(ComputerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
