// src/integrations/binance/api/spot/spot.controller.ts
import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { SpotService, SpotUserTradesParams } from './spot.service';
import { JwtAuthGuard } from '../../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../auth/guards/roles.guard';
import { Roles } from '../../../../auth/decorators/roles.decorator';
import { UserRole } from '../../../../users/schemas/user.schema';

@UseGuards(JwtAuthGuard)
@Controller('binance/spot')
export class SpotController {
  constructor(private readonly service: SpotService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @Get('symbols')
  async symbols() {
    try {
      const data = await this.service.getSymbols();
      return { statusCode: HttpStatus.OK, message: 'OK', data };
    } catch (e: any) {
      throw new HttpException(
        { statusCode: e?.status ?? 500, message: e?.message ?? 'Unexpected error' },
        e?.status ?? 500,
      );
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @Get('trades')
  async trades(@Query('accountId') accountId: string, @Query() q: SpotUserTradesParams) {
    try {
      const data = await this.service.userTrades(accountId, q);
      return { statusCode: HttpStatus.OK, message: 'OK', data };
    } catch (e: any) {
      throw new HttpException(
        { statusCode: e?.status ?? 500, message: e?.message ?? 'Unexpected error' },
        e?.status ?? 500,
      );
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @Get('account')
  async account(@Query('accountId') accountId: string) {
    try {
      const data = await this.service.accountInfo(accountId);
      return { statusCode: HttpStatus.OK, message: 'OK', data };
    } catch (e: any) {
      throw new HttpException(
        { statusCode: e?.status ?? 500, message: e?.message ?? 'Unexpected error' },
        e?.status ?? 500,
      );
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @Get('open-orders')
  async openOrders(@Query('accountId') accountId: string, @Query('symbol') symbol?: string) {
    try {
      const data = await this.service.openOrders(accountId, symbol);
      return { statusCode: HttpStatus.OK, message: 'OK', data };
    } catch (e: any) {
      throw new HttpException(
        { statusCode: e?.status ?? 500, message: e?.message ?? 'Unexpected error' },
        e?.status ?? 500,
      );
    }
  }
}