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
  Req, UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Types } from 'mongoose';
import { UserPlatformsService } from './user-platforms.service';
import { CreateUserPlatformDto } from './dto/create-user-platform.dto';
import { UpdateUserPlatformDto } from './dto/update-user-platform.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('user-platforms')
export class UserPlatformsController {
  constructor(private readonly service: UserPlatformsService) {}

  /** Extrae y valida el ObjectId del usuario desde req.user */
  private getUserId(req: Request): Types.ObjectId {
    const raw =
      (req as any)?.user?._id ??
      (req as any)?.user?.sub; // fallback si tu JWT lleva sub

    if (!raw) {
      throw new HttpException('Missing authenticated user', HttpStatus.UNAUTHORIZED);
    }
    if (!Types.ObjectId.isValid(String(raw))) {
      throw new HttpException('Invalid user id', HttpStatus.BAD_REQUEST);
    }
    return new Types.ObjectId(String(raw));
  }

  /** Helper de éxito 200 */
  private ok<T = unknown>(data: T, message = 'OK') {
    return { statusCode: 200, message, data };
  }

  /** Helper de error 500 si no es HttpException */
  private handleUnknown(e: any, fallback = 'Internal server error') {
    if (e instanceof HttpException) throw e;
    throw new HttpException(
      e?.message ?? fallback,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  @Get()
  async listMine(@Req() req: Request) {
    try {
      const userId = this.getUserId(req);
      const data = await this.service.listMine(userId);
      return this.ok(data);
    } catch (e) {
      this.handleUnknown(e);
    }
  }

  @Post()
  async create(@Req() req: Request, @Body() dto: CreateUserPlatformDto) {
    try {
      const userId = this.getUserId(req);
      const data = await this.service.createMine(userId, dto.platformId, dto.isDefault);
      return this.ok(data, 'Created');
    } catch (e) {
      this.handleUnknown(e);
    }
  }

  @Get(':id')
  async getById(@Req() req: Request, @Param('id') id: string) {
    try {
      const userId = this.getUserId(req);
      const data = await this.service.getMineById(userId, id);
      return this.ok(data);
    } catch (e) {
      this.handleUnknown(e);
    }
  }

  /** Toggle/Set default (garantiza unicidad por usuario) */
  @Patch(':id/default')
  async setDefault(@Req() req: Request, @Param('id') id: string) {
    try {
      const userId = this.getUserId(req);
      const data = await this.service.setDefaultMine(userId, id);
      return this.ok(data, 'Default updated');
    } catch (e) {
      this.handleUnknown(e);
    }
  }

  /** Cambiar estado (pending/connected/disconnected/error) */
  @Patch(':id/status')
  async changeStatus(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: ChangeStatusDto,
  ) {
    try {
      const userId = this.getUserId(req);
      const data = await this.service.changeStatusMine(userId, id, dto.status);
      return this.ok(data, 'Status updated');
    } catch (e) {
      this.handleUnknown(e);
    }
  }

  /** Actualizaciones simples (isActive / isDefault) */
  @Patch(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateUserPlatformDto,
  ) {
    try {
      const userId = this.getUserId(req);
      const data = await this.service.updateMine(userId, id, dto);
      return this.ok(data, 'Updated');
    } catch (e) {
      this.handleUnknown(e);
    }
  }

  @Delete(':id')
  async remove(@Req() req: Request, @Param('id') id: string) {
    try {
      const userId = this.getUserId(req);
      const data = await this.service.removeMine(userId, id);
      return this.ok(data, 'Removed');
    } catch (e) {
      this.handleUnknown(e);
    }
  }
}