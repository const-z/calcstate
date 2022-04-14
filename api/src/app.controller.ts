import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { AppService } from './app.service';
import { DataScheme } from './calc-state.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('generate/:storeName')
  generateData(@Param('storeName') storeName: string) {
    return this.appService.generateBigData(storeName);
  }

  @Get('unique-store-name')
  async getDataEmpty() {
    const storeName = await this.appService.getUniqueStoreName();

    return { storeName };
  }

  @Get('data/:storeName')
  async getData(@Param('storeName') storeName: string): Promise<DataScheme> {
    const data = await this.appService.getData(storeName);

    return data;
  }

  @Post('data/:storeName')
  async saveScheme(
    @Param('storeName') storeName: string,
    @Body() payload: DataScheme,
  ) {
    await this.appService.save(storeName, payload);
  }

  @Post('calc/:storeName')
  async calc(
    @Param('storeName') storeName: string,
    @Body() payload?: { id: string | number },
  ): Promise<void> {
    await this.appService.calc(storeName, payload);
  }
}
