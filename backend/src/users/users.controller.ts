import { Controller, Get, Patch, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('pending')
  getPendingUsers() {
    return this.usersService.getPendingUsers();
  }

  @Get()
  getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @Patch(':id/approve')
  approveUser(@Param('id') id: string, @Body('role') role: string, @Request() req: any) {
    return this.usersService.approveUser(id, req.user.id, role);
  }

  @Patch(':id/reject')
  rejectUser(@Param('id') id: string, @Request() req: any) {
    return this.usersService.rejectUser(id, req.user.id);
  }

  @Patch(':id/role')
  changeRole(@Param('id') id: string, @Body('role') role: string, @Request() req: any) {
    return this.usersService.changeRole(id, role as any, req.user.id);
  }

  @Delete(':id')
  deleteUser(@Param('id') id: string, @Request() req: any) {
    return this.usersService.deleteUser(id, req.user.id);
  }
}
