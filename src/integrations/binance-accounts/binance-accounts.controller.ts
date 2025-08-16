import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  UseGuards,
  Req,
  Body,
  Param,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { Types } from 'mongoose';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { BinanceAccountsService } from './binance-accounts.service';
import { CreateBinanceAccountDto } from './dto/create-binance-account.dto';
import { UpdateBinanceAccountDto } from './dto/update-binance-account.dto';

// Extrae el ObjectId del usuario desde el token
function getUserObjectId(req: Request): Types.ObjectId {
  const u: any = (req as any)?.user;
  const raw = u?.sub ?? u?.id ?? u?._id ?? u?.userId ?? u?.uid;
  if (!raw || !Types.ObjectId.isValid(raw)) {
    throw new HttpException('Invalid user id', HttpStatus.BAD_REQUEST);
  }
  return new Types.ObjectId(raw);
}

@UseGuards(JwtAuthGuard)
@Controller('integrations/binance-accounts')
export class BinanceAccountsController {
  constructor(private readonly service: BinanceAccountsService) {}

  /**
   * Lista las cuentas del usuario, opcionalmente filtradas por plataforma.
   * NO retorna apiSecret, pero SÍ apiKey.
   */
  @Get()
  async listMine(
    @Req() req: Request,
    @Query('platformId') platformId?: string,
  ) {
    try {
      const userId = getUserObjectId(req);
      const data = await this.service.findAllMine(userId, platformId);
      return { statusCode: 200, message: 'Accounts fetched', data };
    } catch (err: any) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  async create(@Req() req: Request, @Body() dto: CreateBinanceAccountDto) {
    try {
      const userId = getUserObjectId(req);
      const data = await this.service.createMine(userId, dto);
      return { statusCode: 201, message: 'Account created', data };
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateBinanceAccountDto,
  ) {
    try {
      const userId = getUserObjectId(req);
      const data = await this.service.updateMine(userId, id, dto);
      return { statusCode: 200, message: 'Account updated', data };
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  async remove(@Req() req: Request, @Param('id') id: string) {
    try {
      const userId = getUserObjectId(req);
      await this.service.removeMine(userId, id);
      return { statusCode: 200, message: 'Account removed' };
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}