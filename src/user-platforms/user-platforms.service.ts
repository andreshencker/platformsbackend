import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import {
  UserPlatform,
  UserPlatformDocument,
  UserPlatformStatus,
} from './schemas/user-platform.schema';

@Injectable()
export class UserPlatformsService {
  constructor(
    @InjectModel(UserPlatform.name)
    private readonly model: Model<UserPlatformDocument>,
  ) {}

  /* ========== Helpers ========== */

  private toObjectId(id: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid id');
    }
    return new Types.ObjectId(id);
  }

  private scope(userId: Types.ObjectId, extra: FilterQuery<UserPlatform> = {}) {
    return { userId, ...extra };
  }

  private readonly platformPopulate = {
    path: 'platform',
    select:
      'name category imageUrl isActive isSupported connectionType', // campos de Platform
  };

  private async clearOtherDefaults(
    userId: Types.ObjectId,
    keepId: Types.ObjectId,
  ) {
    await this.model.updateMany(
      this.scope(userId, { _id: { $ne: keepId }, isDefault: true }),
      { $set: { isDefault: false } },
    );
  }

  /* ========== Queries ========== */

  async listMine(userId: Types.ObjectId) {
    return this.model
      .find(this.scope(userId))
      .sort({ isDefault: -1, createdAt: -1 })
      .populate(this.platformPopulate)
      .lean()
      .exec();
  }

  async getMineById(userId: Types.ObjectId, id: string) {
    const _id = this.toObjectId(id);
    const doc = await this.model
      .findOne(this.scope(userId, { _id }))
      .populate(this.platformPopulate)
      .lean()
      .exec();

    if (!doc) throw new NotFoundException('UserPlatform not found');
    return doc;
  }

  /* ========== Default handling ========== */

  /** Marca un registro como default y limpia otros del mismo usuario */
  async setDefaultMine(userId: Types.ObjectId, id: string) {
    const _id = this.toObjectId(id);

    const doc = await this.model.findOne(this.scope(userId, { _id }));
    if (!doc) throw new NotFoundException('UserPlatform not found');

    if (!doc.isDefault) {
      doc.isDefault = true;
      await doc.save();
      await this.clearOtherDefaults(userId, doc._id);
    }

    // devolver poblado
    return this.model
      .findById(doc._id)
      .populate(this.platformPopulate)
      .lean()
      .exec();
  }

  /* ========== Mutations ========== */

  /**
   * Crea (o trae existente) la relación user-platform.
   * - Si ya existe, la reutiliza y la retorna.
   * - Si isDefault=true, deja esta como default y limpia otras.
   */
  async createMine(
    userId: Types.ObjectId,
    platformId: string,
    isDefault?: boolean,
  ) {
    const pId = this.toObjectId(platformId);

    // Revisa si ya existe (unique por userId+platformId a nivel de índice)
    let doc = await this.model.findOne(this.scope(userId, { platformId: pId }));

    if (!doc) {
      doc = new this.model({
        userId,
        platformId: pId,
        status: UserPlatformStatus.Pending,
        isActive: true,
        isDefault: !!isDefault,
      });

      try {
        await doc.save();
      } catch (e: any) {
        if (e?.code === 11000) {
          throw new ConflictException('UserPlatform already exists');
        }
        throw e;
      }
    } else if (isDefault && !doc.isDefault) {
      // si ya existe y piden default, se aplica
      doc.isDefault = true;
      await doc.save();
    }

    if (doc.isDefault) {
      await this.clearOtherDefaults(userId, doc._id);
    }

    // devolver poblado
    return this.model
      .findById(doc._id)
      .populate(this.platformPopulate)
      .lean()
      .exec();
  }

  async changeStatusMine(
    userId: Types.ObjectId,
    id: string,
    status: UserPlatformStatus,
  ) {
    const _id = this.toObjectId(id);
    const doc = await this.model.findOne(this.scope(userId, { _id }));
    if (!doc) throw new NotFoundException('UserPlatform not found');

    doc.status = status;
    await doc.save();

    return this.model
      .findById(doc._id)
      .populate(this.platformPopulate)
      .lean()
      .exec();
  }

  async updateMine(
    userId: Types.ObjectId,
    id: string,
    payload: Partial<Pick<UserPlatform, 'isActive' | 'isDefault'>>,
  ) {
    const _id = this.toObjectId(id);
    const doc = await this.model.findOne(this.scope(userId, { _id }));
    if (!doc) throw new NotFoundException('UserPlatform not found');

    if (typeof payload.isActive === 'boolean') {
      doc.isActive = payload.isActive;
    }

    if (typeof payload.isDefault === 'boolean') {
      doc.isDefault = payload.isDefault;
    }

    await doc.save();

    if (doc.isDefault) {
      await this.clearOtherDefaults(userId, doc._id);
    }

    return this.model
      .findById(doc._id)
      .populate(this.platformPopulate)
      .lean()
      .exec();
  }

  async removeMine(userId: Types.ObjectId, id: string) {
    const _id = this.toObjectId(id);
    const res = await this.model.deleteOne(this.scope(userId, { _id }));
    if (res.deletedCount === 0) throw new NotFoundException('UserPlatform not found');
    return { ok: true };
  }
}