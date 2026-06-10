import { Controller, Get, UseGuards } from '@nestjs/common';
import { RankingsService } from './rankings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('BETTOR', 'ADMIN')
@Controller('rankings')
export class RankingsController {
  constructor(private rankingsService: RankingsService) {}

  @Get()
  getRanking() {
    return this.rankingsService.getRanking();
  }
}
