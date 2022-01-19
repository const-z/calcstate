import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InfluenceModule } from './influence/influence.module';

@Module({
  imports: [InfluenceModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
