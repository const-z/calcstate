import { Test, TestingModule } from '@nestjs/testing';
import { InfluenceService } from './influence.service';

describe('InfluenceService', () => {
  let service: InfluenceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InfluenceService],
    }).compile();

    service = module.get<InfluenceService>(InfluenceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
