import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { MarginService } from './margin.service';
import type { MarginTradesParams, MarginMarket } from './margin.service';
import { JwtAuthGuard } from '../../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../auth/guards/roles.guard';
import { Roles } from '../../../../auth/decorators/roles.decorator';
import { UserRole } from '../../../../users/schemas/user.schema';

@UseGuards(JwtAuthGuard)
@Controller('binance/margin')
export class MarginController {
  constructor(private readonly service: MarginService) {}

  // GET /binance/margin/:market/trades?accountId=..&symbol=BTCUSDT&limit=50
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @Get(':market/trades')
  async trades(
    @Param('market') market: MarginMarket,
    @Query('accountId') accountId: string,
    @Query() q: MarginTradesParams,
  ) {
    try {
      const data = await this.service.userTradesByMarket(market, accountId, q);
      return { statusCode: HttpStatus.OK, message: 'OK', data };
    } catch (e: any) {
      throw new HttpException(
        { statusCode: e?.status ?? 500, message: e?.message ?? 'Unexpected error' },
        e?.status ?? 500,
      );
    }
  }

  // GET /binance/margin/:market/account?accountId=..[&symbols=BTCUSDT,BNBUSDT] (symbols solo aplica a ISOLATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @Get(':market/account')
  async account(
    @Param('market') market: MarginMarket,
    @Query('accountId') accountId: string,
    @Query('symbols') symbolsCsv?: string,
  ) {
    try {
      const data = await this.service.accountByMarket(market, accountId, symbolsCsv);
      return { statusCode: HttpStatus.OK, message: 'OK', data };
    } catch (e: any) {
      throw new HttpException(
        { statusCode: e?.status ?? 500, message: e?.message ?? 'Unexpected error' },
        e?.status ?? 500,
      );
    }
  }

  // GET /binance/margin/:market/open-orders?accountId=..[&symbol=BTCUSDT]
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @Get(':market/open-orders')
  async openOrders(
    @Param('market') market: MarginMarket,
    @Query('accountId') accountId: string,
    @Query('symbol') symbol?: string,
  ) {
    try {
      const data = await this.service.openOrdersByMarket(market, accountId, symbol);
      return { statusCode: HttpStatus.OK, message: 'OK', data };
    } catch (e: any) {
      throw new HttpException(
        { statusCode: e?.status ?? 500, message: e?.message ?? 'Unexpected error' },
        e?.status ?? 500,
      );
    }
  }
}