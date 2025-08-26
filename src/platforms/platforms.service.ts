import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { Platform, PlatformDocument } from './schemas/platform.schema';
import { CreatePlatformDto } from './dto/create-platform.dto';
import { UpdatePlatformDto } from './dto/update-platform.dto';

@Injectable()
export class PlatformsService {
  constructor(
    @InjectModel(Platform.name) private readonly model: Model<PlatformDocument>,
  ) {}

  async findAll(params?: { supported?: boolean }): Promise<Platform[]> {
    try {
      const filter: FilterQuery<PlatformDocument> = {};
      if (typeof params?.supported === 'boolean') {
        filter.isSupported = params.supported;
      }
      // Puedes agregar más filtros (isActive, category, etc.)
      return await this.model.find(filter).sort({ name: 1 }).lean();
    } catch (err) {
      throw new HttpException(
        err?.message ?? 'Failed to fetch platforms',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async create(dto: CreatePlatformDto): Promise<Platform> {
    try {
      // name es único; capturamos error 11000
      const created = await this.model.create({
        name: dto.name.trim(),
        category: dto.category,
        imageUrl: dto.imageUrl?.trim() || undefined,
        isActive: dto.isActive ?? true,
        isSupported: dto.isSupported ?? false,
      });
      return created.toObject();
    } catch (err: any) {
      if (err?.code === 11000) {
        throw new HttpException('Platform name already exists', HttpStatus.BAD_REQUEST);
      }
      throw new HttpException(
        err?.message ?? 'Failed to create platform',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(id: string, dto: UpdatePlatformDto): Promise<Platform> {
    try {
      const update: any = {};
      if (dto.name !== undefined) update.name = dto.name.trim();
      if (dto.category !== undefined) update.category = dto.category;
      if (dto.imageUrl !== undefined) update.imageUrl = dto.imageUrl?.trim() || '';
      if (dto.isActive !== undefined) update.isActive = dto.isActive;
      if (dto.isSupported !== undefined) update.isSupported = dto.isSupported;

      const doc = await this.model.findByIdAndUpdate(id, update, { new: true });
      if (!doc) {
        throw new HttpException('Platform not found', HttpStatus.NOT_FOUND);
      }
      return doc.toObject();
    } catch (err: any) {
      if (err?.code === 11000) {
        throw new HttpException('Platform name already exists', HttpStatus.BAD_REQUEST);
      }
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        err?.message ?? 'Failed to update platform',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    try {
      const res = await this.model.findByIdAndDelete(id);
      if (!res) {
        throw new HttpException('Platform not found', HttpStatus.NOT_FOUND);
      }
      return { deleted: true };
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        err?.message ?? 'Failed to delete platform',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}