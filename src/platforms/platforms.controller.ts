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
  UseGuards,
} from '@nestjs/common';
import { PlatformsService } from './platforms.service';
import { CreatePlatformDto } from './dto/create-platform.dto';
import { UpdatePlatformDto } from './dto/update-platform.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller()
export class PlatformsController {
  constructor(private readonly platformsService: PlatformsService) {}

  /** Catálogo visible para usuario autenticado */
  @Get('platforms')
  async getActive() {
    try {
      const data = await this.platformsService.findActive();
      return { statusCode: 200, message: 'Platforms fetched successfully', data };
    } catch (err) {
      throw new HttpException(
        {
          statusCode: 500,
          message: 'Failed to fetch active platforms',
          error: err?.message || err,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /** ADMIN */
  @Get('admin/platforms')
  async findAll() {
    try {
      const data = await this.platformsService.findAll();
      return { statusCode: 200, message: 'All platforms fetched successfully', data };
    } catch (err) {
      throw new HttpException(
        {
          statusCode: 500,
          message: 'Failed to fetch platforms',
          error: err?.message || err,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('admin/platforms')
  async create(@Body() dto: CreatePlatformDto) {
    try {
      const data = await this.platformsService.create(dto);
      return { statusCode: 200, message: 'Platform created successfully', data };
    } catch (err) {
      throw new HttpException(
        {
          statusCode: err?.status || 400,
          message: err?.message || 'Failed to create platform',
        },
        err?.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Patch('admin/platforms/:id')
  async update(@Param('id') id: string, @Body() dto: UpdatePlatformDto) {
    try {
      const data = await this.platformsService.update(id, dto);
      return { statusCode: 200, message: 'Platform updated successfully', data };
    } catch (err) {
      throw new HttpException(
        {
          statusCode: err?.status || 400,
          message: err?.message || 'Failed to update platform',
        },
        err?.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete('admin/platforms/:id')
  async remove(@Param('id') id: string) {
    try {
      await this.platformsService.remove(id);
      return { statusCode: 200, message: 'Platform removed successfully' };
    } catch (err) {
      throw new HttpException(
        {
          statusCode: err?.status || 400,
          message: err?.message || 'Failed to remove platform',
        },
        err?.status || HttpStatus.BAD_REQUEST,
      );
    }
  }
}