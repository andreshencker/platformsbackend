// src/integrations/binance/api/futures/binanceFutures.controller.ts
import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../auth/guards/roles.guard';
import { Roles } from '../../../../auth/decorators/roles.decorator';
import { UserRole } from '../../../../users/schemas/user.schema';

import { BinanceFuturesService } from './binanceFutures.service';
import type { UserTradesParams, Market } from './binanceFutures.service';


@UseGuards(JwtAuthGuard)
@Controller('binance/futures')
export class BinanceFuturesController {
  constructor(private readonly service: BinanceFuturesService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @Get('symbols/:market')
  async symbols(@Param('market') market: Market) {
    try {
      const data = await this.service.getSymbols(market);
      return { statusCode: HttpStatus.OK, message: 'OK', data };
    } catch (e: any) {
      throw new HttpException(
        {
          statusCode: e?.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
          message: e?.message ?? 'Unexpected error',
        },
        e?.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @Get(':market/trades')
  async trades(
    @Param('market') market: Market,
    @Query('accountId') accountId: string,
    @Query() q: UserTradesParams,
  ) {
    try {
      const data = await this.service.userTradesByMarket(market, accountId, q);
      return { statusCode: HttpStatus.OK, message: 'OK', data };
    } catch (e: any) {
      throw new HttpException(
        {
          statusCode: e?.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
          message: e?.message ?? 'Unexpected error',
        },
        e?.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @Get('account')
  async account(@Query('accountId') accountId: string) {
    try {
      const data = await this.service.futuresAccount(accountId);
      return { statusCode: HttpStatus.OK, message: 'OK', data };
    } catch (e: any) {
      throw new HttpException(
        {
          statusCode: e?.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
          message: e?.message ?? 'Unexpected error',
        },
        e?.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @Get('positions')
  async positions(@Query('accountId') accountId: string) {
    try {
      const data = await this.service.futuresPositions(accountId);
      return { statusCode: HttpStatus.OK, message: 'OK', data };
    } catch (e: any) {
      throw new HttpException(
        {
          statusCode: e?.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
          message: e?.message ?? 'Unexpected error',
        },
        e?.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}