import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getPendingUsers() {
    return this.prisma.user.findMany({
      where: { status: 'PENDING' },
      select: { id: true, name: true, email: true, created_at: true }
    });
  }

  async approveUser(id: string, adminId: string, role?: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: 'APPROVED', role: (role as any) || 'BETTOR', approved_at: new Date(), approved_by: adminId }
    });

    await this.prisma.auditLog.create({
      data: {
        user_id: adminId,
        action: 'APPROVE_USER',
        entity: 'User',
        entity_id: id,
        old_value: JSON.stringify({ status: user.status }),
        new_value: JSON.stringify({ status: 'APPROVED' })
      }
    });

    return updated;
  }

  async rejectUser(id: string, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: 'REJECTED' }
    });

    await this.prisma.auditLog.create({
      data: {
        user_id: adminId,
        action: 'REJECT_USER',
        entity: 'User',
        entity_id: id,
        old_value: JSON.stringify({ status: user.status }),
        new_value: JSON.stringify({ status: 'REJECTED' })
      }
    });

    return updated;
  }

  async changeRole(id: string, role: any, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id },
      data: { role }
    });

    await this.prisma.auditLog.create({
      data: {
        user_id: adminId,
        action: 'CHANGE_ROLE',
        entity: 'User',
        entity_id: id,
        old_value: JSON.stringify({ role: user.role }),
        new_value: JSON.stringify({ role })
      }
    });

    return updated;
  }

  async getAllUsers() {
    return this.prisma.user.findMany({
      where: { status: { not: 'REJECTED' } },
      select: { id: true, name: true, email: true, role: true, status: true, created_at: true }
    });
  }

  async deleteUser(id: string, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.$transaction([
      this.prisma.scoreDetail.deleteMany({ where: { user_id: id } }),
      this.prisma.groupPrediction.deleteMany({ where: { user_id: id } }),
      this.prisma.knockoutPrediction.deleteMany({ where: { user_id: id } }),
      this.prisma.auditLog.deleteMany({ where: { user_id: id } }),
      this.prisma.user.delete({ where: { id } })
    ]);

    await this.prisma.auditLog.create({
      data: {
        user_id: adminId,
        action: 'DELETE_USER',
        entity: 'User',
        entity_id: id,
        old_value: JSON.stringify({ email: user.email }),
      }
    });

    return { message: 'User deleted successfully' };
  }
}
