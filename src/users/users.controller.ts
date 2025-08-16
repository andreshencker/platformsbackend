import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Res,
  HttpStatus,
  HttpException,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './schemas/user.schema';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** admin: listar todos */
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  async findAll(@Res() res: Response) {
    try {
      const data = await this.usersService.findAll();
      return res.status(HttpStatus.OK).json({ status: 200, data });
    } catch (err: any) {
      const code = err?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      return res.status(code).json({ status: code, message: err?.message ?? 'Error' });
    }
  }

  /** perfil propio */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: Request, @Res() res: Response) {
    try {
      const userId = (req as any)?.user?.sub;
      const data = await this.usersService.findMe(userId);
      return res.status(HttpStatus.OK).json({ status: 200, data });
    } catch (err: any) {
      const code = err?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      return res.status(code).json({ status: code, message: err?.message ?? 'Error' });
    }
  }

  /** obtener uno por id (admin) */
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res: Response) {
    try {
      const data = await this.usersService.findOne(id);
      return res.status(HttpStatus.OK).json({ status: 200, data });
    } catch (err: any) {
      const code = err?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      return res.status(code).json({ status: code, message: err?.message ?? 'Error' });
    }
  }

  /** actualizar mi perfil */
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateProfile(@Req() req: Request, @Body() dto: UpdateUserDto, @Res() res: Response) {
    try {
      const userId = (req as any)?.user?.sub;
      const data = await this.usersService.updateProfile(userId, dto);
      return res.status(HttpStatus.OK).json({ status: 200, message: 'Updated', data });
    } catch (err: any) {
      const code = err?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      return res.status(code).json({ status: code, message: err?.message ?? 'Error' });
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id/role')
  async updateRole(
    @Param('id') id: string,
    @Body('role') role: UserRole,
    @Res() res: Response
  ) {
    try {
      const data = await this.usersService.updateUserRoleByAdmin(id, role);
      return res.status(HttpStatus.OK).json({ status: 200, message: 'Role updated', data });
    } catch (err: any) {
      const code = err?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      return res.status(code).json({ status: code, message: err?.message ?? 'Error updating role' });
    }
  }

  /** eliminar (admin) */
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res: Response) {
    try {
      const data = await this.usersService.remove(id);
      return res.status(HttpStatus.OK).json({ status: 200, message: 'Deleted', data });
    } catch (err: any) {
      const code = err?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      return res.status(code).json({ status: code, message: err?.message ?? 'Error' });
    }
  }
}