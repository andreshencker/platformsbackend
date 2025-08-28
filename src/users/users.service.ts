import { Injectable, HttpException, HttpStatus, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument, UserRole } from './schemas/user.schema';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserAdminDto } from './dto/create-user-admin.dto';
import bcrypt from 'bcryptjs';


type CreateParams = {
  email: string;
  passwordHash: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  secondLastName?: string;
  // role e isActive si quieres permitir setearlos desde otro módulo admin:
  role?: User['role'];
  isActive?: boolean;
};

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  /** Crea usuario (recibe HASH) */
  async create(params: CreateParams) {
    try {
      const exists = await this.userModel.findOne({ email: params.email }).lean();
      if (exists) {
        throw new HttpException('Email already in use', HttpStatus.BAD_REQUEST);
      }

      const created = await this.userModel.create({
        email: params.email,
        passwordHash: params.passwordHash,
        firstName: params.firstName,
        middleName: params.middleName,
        lastName: params.lastName,
        secondLastName: params.secondLastName,
        role: params.role,           // opcional
        isActive: params.isActive,   // opcional
      });

      const obj = created.toObject();
      delete (obj as any).passwordHash;
      return obj;
    } catch (err: any) {
      const code = err?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(err?.message ?? 'Failed to create user', code);
    }
  }

  async createByAdmin(dto: CreateUserAdminDto): Promise<User> {
    // ¿email ya existe?
    const exists = await this.userModel.exists({ email: dto.email.toLowerCase().trim() });
    if (exists) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const doc = await this.userModel.create({
      firstName: dto.firstName.trim(),
      middleName: dto.middleName?.trim() || undefined,
      lastName: dto.lastName.trim(),
      secondLastName: dto.secondLastName?.trim() || undefined,
      email: dto.email.toLowerCase().trim(),
      passwordHash,
      role: dto.role,
      isActive: dto.isActive ?? true,
      avatarUrl: dto.avatarUrl?.trim() || undefined,
    });

    // Quitar passwordHash del objeto de retorno
    const obj = doc.toObject();
    delete (obj as any).passwordHash;
    return obj as User;
  }




  /** Lista todos (ADMIN) */
  async findAll() {
    try {
      const list = await this.userModel
        .find({}, { passwordHash: 0 })
        .sort({ createdAt: -1 })
        .lean();
      return list;
    } catch {
      throw new HttpException('Failed to list users', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /** Perfil del propio usuario */
  async findMe(userId: string | Types.ObjectId) {
    try {
      const id = new Types.ObjectId(userId);
      const doc = await this.userModel.findById(id, { passwordHash: 0 }).lean();
      if (!doc) throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      return doc;
    } catch (err: any) {
      const code = err?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(err?.message ?? 'Failed to fetch profile', code);
    }
  }

  /** Busca uno por id */
  async findOne(id: string) {
    try {
      const _id = new Types.ObjectId(id);
      const doc = await this.userModel.findById(_id, { passwordHash: 0 }).lean();
      if (!doc) throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      return doc;
    } catch (err: any) {
      const code = err?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(err?.message ?? 'Failed to fetch user', code);
    }
  }

  /** Actualiza perfil (campos públicos) */
  async updateProfile(userId: string | Types.ObjectId, dto: UpdateUserDto) {
    try {
      const id = new Types.ObjectId(userId);
      const update: any = {};
      for (const key of [
        'firstName',
        'middleName',
        'lastName',
        'secondLastName',
        'email',
        'role',
        'isActive',
      ] as const) {
        if (dto[key] !== undefined) update[key] = dto[key];
      }

      const updated = await this.userModel
        .findByIdAndUpdate(id, update, { new: true, projection: { passwordHash: 0 } })
        .lean();

      if (!updated) throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      return updated;
    } catch (err: any) {
      const code = err?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(err?.message ?? 'Failed to update profile', code);
    }
  }

  async updateUserRoleByAdmin(id: string, role: UserRole) {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new HttpException('Invalid user id', HttpStatus.BAD_REQUEST);
      }

      // Opcional: si ya tiene ese rol, puedes retornar tal cual
      const updated = await this.userModel.findByIdAndUpdate(
        id,
        { role },
        { new: true, runValidators: true },
      );

      if (!updated) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      const obj = updated.toObject();
      // sanear salida
      delete (obj as any).password;

      return obj;
    } catch (err: any) {
      if (err?.status && err?.status < 500) {
        throw err;
      }
      throw new HttpException(
        err?.message ?? 'Failed to update role',
        err?.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /** Elimina definitivamente (o podrías hacer soft-delete) */
  async remove(id: string) {
    try {
      const _id = new Types.ObjectId(id);
      const { deletedCount } = await this.userModel.deleteOne({ _id });
      if (!deletedCount) throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      return { deleted: true };
    } catch (err: any) {
      const code = err?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(err?.message ?? 'Failed to delete user', code);
    }
  }
}