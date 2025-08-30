// src/integrations/binance/user-symbols/user-symbols.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { UserRole } from '../../../users/schemas/user.schema';

import { UserSymbolsService } from './user-symbols.service';
import { CreateUserSymbolDto } from './dto/create-user-symbol.dto';
import { UpdateUserSymbolDto } from './dto/update-user-symbol.dto';
import { Market } from './schemas/user-symbol.schema';

@UseGuards(JwtAuthGuard)
@Controller('integrations/binance/user-symbols')
export class UserSymbolsController {
  constructor(private readonly service: UserSymbolsService) {}

  /** Helpers de respuesta unificada */
  private ok<T = unknown>(data: T, message = 'OK') {
    return { statusCode: 200, message, data };
  }
  private created<T = unknown>(data: T, message = 'Created') {
    return { statusCode: 201, message, data };
  }
  private handleUnknown(e: any, fallback = 'Internal server error') {
    if (e instanceof HttpException) throw e;
    throw new HttpException(e?.message ?? fallback, HttpStatus.INTERNAL_SERVER_ERROR);
  }

  /** GET /integrations/binance/user-symbols?accountId=...&market=USDM */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @Get()
  async list(
    @Query('accountId') accountId: string,
    @Query('market') market?: Market,
  ) {
    try {
      if (!accountId) {
        throw new HttpException('accountId is required', HttpStatus.BAD_REQUEST);
      }
      const data = await this.service.listByAccount(accountId, market);
      return this.ok(data);
    } catch (e) {
      this.handleUnknown(e);
    }
  }

  /** GET /integrations/binance/user-symbols/:id */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @Get(':id')
  async getById(@Param('id') id: string) {
    try {
      const data = await this.service.getById(id);
      return this.ok(data);
    } catch (e) {
      this.handleUnknown(e);
    }
  }

  /** POST /integrations/binance/user-symbols */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @Post()
  async create(@Body() dto: CreateUserSymbolDto) {
    try {
      const data = await this.service.create(dto);
      // 201 CREATED estándar
      return this.created(data);
    } catch (e) {
      this.handleUnknown(e);
    }
  }

  /** PATCH /integrations/binance/user-symbols/:id */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserSymbolDto) {
    try {
      const data = await this.service.update(id, dto);
      return this.ok(data, 'Updated');
    } catch (e) {
      this.handleUnknown(e);
    }
  }

  /** DELETE /integrations/binance/user-symbols/:id */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const data = await this.service.remove(id);
      return this.ok(data, 'Removed');
    } catch (e) {
      this.handleUnknown(e);
    }
  }
}