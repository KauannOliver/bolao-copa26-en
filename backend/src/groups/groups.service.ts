import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.group.findMany({
      include: { Team: true },
      orderBy: { letter: 'asc' }
    });
  }

  async findTeams(groupId: string) {
    return this.prisma.team.findMany({
      where: { group_id: groupId }
    });
  }

  async findAllTeams() {
    return this.prisma.team.findMany();
  }
}
