import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { PlatformsService } from './platforms.service';
import { CreatePlatformDto } from './dto/create-platform.dto';
import { UpdatePlatformDto } from './dto/update-platform.dto';

// Ajusta rutas de guards/decorators a tu estructura real
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@Controller('platforms')
export class PlatformsController {
  constructor(private readonly service: PlatformsService) {}

  /**
   * GET /platforms?supported=true|false
   * Recomendado: accesible con sesión (o público, según tu política).
   */
  @UseGuards(JwtAuthGuard)
  @Get()
  async list(@Query('supported') supported?: string) {
    try {
      const sup =
        typeof supported === 'string'
          ? supported.toLowerCase() === 'true'
          : undefined;

      const data = await this.service.findAll({ supported: sup as any });
      return { status: 200, message: 'OK', data };
    } catch (err: any) {
      const code = err?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException({ status: code, message: err?.message ?? 'Error' }, code);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getById(@Param('id') id: string) {
    try {
      const data = await this.service.findById(id);
      return { status: 200, message: 'OK', data };
    } catch (err: any) {
      const code = err?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(
        { status: code, message: err?.message ?? 'Error' },
        code,
      );
    }
  }

  /** POST /platforms — solo ADMIN */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  async create(@Body() dto: CreatePlatformDto) {
    try {
      const data = await this.service.create(dto);
      return { status: 200, message: 'Created', data };
    } catch (err: any) {
      const code =
        err?.status ??
        (err?.name === 'ValidationError' ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR);
      throw new HttpException({ status: code, message: err?.message ?? 'Error' }, code);
    }
  }

  /** PATCH /platforms/:id — solo ADMIN */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdatePlatformDto) {
    try {
      const data = await this.service.update(id, dto);
      return { status: 200, message: 'Updated', data };
    } catch (err: any) {
      const code =
        err?.status ??
        (err?.name === 'ValidationError' ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR);
      throw new HttpException({ status: code, message: err?.message ?? 'Error' }, code);
    }
  }

  /** DELETE /platforms/:id — solo ADMIN */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const data = await this.service.remove(id);
      return { status: 200, message: 'Deleted', data };
    } catch (err: any) {
      const code = err?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException({ status: code, message: err?.message ?? 'Error' }, code);
    }
  }
}