import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService, DataScheme } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('data')
  getData(): DataScheme {
    return this.appService.getData();
  }

  @Post('data')
  async saveScheme(@Body() payload: any) {
    console.log(payload);

    return true;
  }

  @Post('calc')
  calc(@Body() payload: any): DataScheme {
    const data = this.appService.calc(payload);

    return data;
  }
}
