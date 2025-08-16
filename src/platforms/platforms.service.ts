import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Platform,
  PlatformDocument,
} from './schemas/platform.schema';
import { CreatePlatformDto } from './dto/create-platform.dto';
import { UpdatePlatformDto } from './dto/update-platform.dto';

@Injectable()
export class PlatformsService {
  constructor(
    @InjectModel(Platform.name)
    private readonly platformModel: Model<PlatformDocument>,
  ) {}

  /** Catálogo activo para usuarios */
  async findActive(): Promise<Platform[]> {
    try {
      return await this.platformModel.find({ isActive: true }).lean();
    } catch (err) {
      throw new BadRequestException('Failed to fetch platforms');
    }
  }

  /** ADMIN: listar todas */
  async findAll(): Promise<Platform[]> {
    try {
      return await this.platformModel.find().lean();
    } catch (err) {
      throw new BadRequestException('Failed to fetch all platforms');
    }
  }

  /** ADMIN: crear */
  async create(dto: CreatePlatformDto): Promise<Platform> {
    try {
      const exists = await this.platformModel
        .findOne({ name: dto.name.trim() })
        .lean();
      if (exists) {
        throw new BadRequestException('Platform with this name already exists');
      }
      const created = await this.platformModel.create(dto);
      return created.toObject();
    } catch (err) {
      // Si ya es HttpException, propágala; si no, wrap
      if (err?.status) throw err;
      throw new BadRequestException('Failed to create platform');
    }
  }

  /** ADMIN: actualizar */
  async update(id: string, dto: UpdatePlatformDto): Promise<Platform> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid platform id');
      }
      const updated = await this.platformModel.findByIdAndUpdate(id, dto, {
        new: true,
      });
      if (!updated) throw new NotFoundException('Platform not found');
      return updated.toObject();
    } catch (err) {
      if (err?.status) throw err;
      throw new BadRequestException('Failed to update platform');
    }
  }

  /** ADMIN: eliminar */
  async remove(id: string): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid platform id');
      }
      const res = await this.platformModel.findByIdAndDelete(id);
      if (!res) throw new NotFoundException('Platform not found');
    } catch (err) {
      if (err?.status) throw err;
      throw new BadRequestException('Failed to remove platform');
    }
  }
}