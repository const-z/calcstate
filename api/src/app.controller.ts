import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { DataScheme } from './calc-state.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('generate')
  generateData() {
    return this.appService.generateBigData();
  }

  @Get('data')
  async getData(): Promise<DataScheme> {
    const data = await this.appService.getData();

    return data;
  }

  @Post('data')
  async saveScheme(@Body() payload: DataScheme) {
    await this.appService.save(payload);
  }

  @Post('calc')
  async calc(@Body() payload?: { id: string | number }): Promise<void> {
    await this.appService.calc(payload);
  }
}
