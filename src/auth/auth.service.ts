import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { UserRole } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(private readonly users: UsersService, private readonly jwt: JwtService) {}

  /** firma de token */
  async signToken(userId: string, email: string, role: UserRole) {
    const payload = { sub: userId, email, role };
    return this.jwt.signAsync(payload, {
      secret: process.env.JWT_SECRET!,
      expiresIn: process.env.JWT_EXPIRES ?? '7d',
    });
  }

  /** login con email y password plano */
  async login(email: string, password: string) {
    try {
      // obtenemos por email (sin exponer hash)
      const found = await this.users['userModel']
        .findOne({ email })
        .select('+passwordHash')
        .lean();

      if (!found) throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);

      const ok = await bcrypt.compare(password, found.passwordHash);
      if (!ok) throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);

      const token = await this.signToken(String(found._id), found.email, found.role);
      // devolvemos user sin hash
      const { passwordHash, ...safe } = found;
      return { user: safe, access_token: token };
    } catch (err: any) {
      const code = err?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(err?.message ?? 'Login failed', code);
    }
  }

  /** registro */
  async register(dto: RegisterDto) {
    try {
      const hash = await bcrypt.hash(dto.password, 12);
      const user = await this.users.create({
        email: dto.email,
        passwordHash: hash,
        firstName: dto.firstName,
        middleName: dto.middleName,
        lastName: dto.lastName,
        secondLastName: dto.secondLastName,
      });

      const token = await this.signToken(String((user as any)._id ?? ''), user.email, user.role);
      return { user, access_token: token };
    } catch (err: any) {
      const code = err?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(err?.message ?? 'Register failed', code);
    }
  }

  async validateUser(email: string, password: string) {
    try {
      // obtenemos el usuario con hash
      const found = await this.users['userModel']
        .findOne({ email })
        .select('+passwordHash')
        .lean();

      if (!found) return null;

      const ok = await bcrypt.compare(password, found.passwordHash);
      if (!ok) return null;

      const { passwordHash, ...safe } = found;
      return safe; // <- usuario sin hash
    } catch (err: any) {
      const code = err?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(err?.message ?? 'validateUser failed', code);
    }
  }

  /** perfil por id */
  async me(userId: string) {
    return this.users.findMe(userId);
  }

  /** cambiar contraseña */
  async changePassword(userId: string, current: string, next: string) {
    try {
      const raw = await this.users['userModel']
        .findById(userId)
        .select('+passwordHash')
        .lean();

      if (!raw) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

      const ok = await bcrypt.compare(current, raw.passwordHash);
      if (!ok) throw new HttpException('Invalid current password', HttpStatus.BAD_REQUEST);

      const newHash = await bcrypt.hash(next, 12);
      await this.users['userModel'].updateOne({ _id: raw._id }, { $set: { passwordHash: newHash } });

      return { changed: true };
    } catch (err: any) {
      const code = err?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(err?.message ?? 'Failed to change password', code);
    }
  }
}