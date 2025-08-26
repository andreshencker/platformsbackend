// src/integrations/binance/binance-accounts/binance-accounts.controller.ts
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
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { BinanceAccountsService } from './binance-accounts.service';
import { CreateBinanceAccountDto } from './dto/create-binance-account.dto';
import { UpdateBinanceAccountDto } from './dto/update-binance-account.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { UserRole } from '../../../users/schemas/user.schema';
import { RolesGuard } from '../../../auth/guards/roles.guard';

// Si ya tienes tu guard de JWT, descomenta este import y el @UseGuards
// import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

type AuthRequest = Request & {
  user?: { sub?: string; _id?: string };
};
@UseGuards(JwtAuthGuard)
@Controller('integrations/binance-accounts')
// @UseGuards(JwtAuthGuard) // <-- habilítalo si tu proyecto ya lo usa aquí
export class BinanceAccountsController {
  constructor(private readonly service: BinanceAccountsService) {}

  /** Listar mis cuentas (opcionalmente filtradas por userPlatformId) */
  @Get()
  async listMine(@Req() req: AuthRequest) {
    const raw = req.user?.sub ?? req.user?._id;
    if (!raw) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    return this.service.listMine(raw as any, req.query?.userPlatformId as string | undefined);
  }

  /** Crear una cuenta (verifica credenciales antes de persistir) */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @Post()
  async create(@Req() req: AuthRequest, @Body() dto: CreateBinanceAccountDto) {
    const raw = req.user?.sub ?? req.user?._id;
    if (!raw) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    const created = await this.service.createMine(raw as any, dto);
    return { status: 'created', data: created };
  }

  /** Obtener una cuenta por id (sólo si es mía) */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @Get(':id')
  async getById(@Req() req: AuthRequest, @Param('id') id: string) {
    const raw = req.user?.sub ?? req.user?._id;
    if (!raw) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    // Reutilizamos listMine para mantener la misma proyección/seguridad
    const rows = await this.service.listMine(raw as any);
    const found = rows.find((r: any) => String(r._id) === String(id));
    if (!found) {
      throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
    }
    return found;
  }

  /** Marcar una cuenta como default (desmarca las demás del mismo user+userPlatform) */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @Patch(':id/default')
  async setDefault(@Req() req: AuthRequest, @Param('id') id: string) {
    const raw = req.user?.sub ?? req.user?._id;
    if (!raw) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    const updated = await this.service.updateMine(raw as any, id, { isDefault: true });
    return { status: 'ok', data: updated };
  }

  /** Actualizar campos de la cuenta (description, apiKey, apiSecret, isActive, isDefault) */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @Patch(':id')
  async update(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateBinanceAccountDto,
  ) {
    const raw = req.user?.sub ?? req.user?._id;
    if (!raw) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    const updated = await this.service.updateMine(raw as any, id, dto);
    return { status: 'ok', data: updated };
  }

  /** Eliminar mi cuenta por id */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @Delete(':id')
  async remove(@Req() req: AuthRequest, @Param('id') id: string) {
    const raw = req.user?.sub ?? req.user?._id;
    if (!raw) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    const res = await this.service.removeMine(raw as any, id);
    return { status: 'ok', ...res };
  }
}