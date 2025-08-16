import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpException,
  Get,
  UseGuards,
  Patch,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    try {
      const data = await this.auth.login(dto.email, dto.password);
      return { status: 200, ...data };
    } catch (err: any) {
      const code = err?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException({ status: code, message: err?.message ?? 'Login failed' }, code);
    }
  }

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    try {
      const data = await this.auth.register(dto);
      return { status: 201, ...data };
    } catch (err: any) {
      const code = err?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException({ status: code, message: err?.message ?? 'Register failed' }, code);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: Request) {
    try {
      const userId = (req as any)?.user?.sub;
      const data = await this.auth.me(userId);
      return { status: 200, data };
    } catch (err: any) {
      const code = err?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException({ status: code, message: err?.message ?? 'Failed to load profile' }, code);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch('password')
  async changePassword(@Req() req: Request, @Body() dto: ChangePasswordDto) {
    try {
      const userId = (req as any)?.user?.sub;
      const data = await this.auth.changePassword(userId, dto.current, dto.next);
      return { status: 200, message: 'Password updated', data };
    } catch (err: any) {
      const code = err?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException({ status: code, message: err?.message ?? 'Failed to change password' }, code);
    }
  }
}