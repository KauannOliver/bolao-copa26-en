import { Controller, Get, Post, Put, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('settings')
  getSettings() {
    return this.adminService.getSettings();
  }

  @Patch('settings/group-deadline')
  setGroupDeadline(@Body('deadline') deadline: string, @Request() req: any) {
    return this.adminService.setGroupDeadline(new Date(deadline), req.user.id);
  }

  @Patch('settings/knockout-phases')
  updateKnockoutSettings(@Body() data: any, @Request() req: any) {
    return this.adminService.updateKnockoutSettings(data, req.user.id);
  }

  @Get('group-results')
  getGroupResults() {
    return this.adminService.getGroupResults();
  }

  @Post('group-results')
  saveGroupResults(@Body('results') results: any[], @Request() req: any) {
    return this.adminService.saveGroupResults(results, req.user.id);
  }

  @Post('group-results/calculate-scores')
  calculateGroupScores(@Request() req: any) {
    return this.adminService.calculateGroupScores(req.user.id);
  }

  @Post('knockout/generate')
  generateRoundOf32(@Body('thirdPlaceMappings') mappings: any[], @Request() req: any) {
    return this.adminService.generateRoundOf32(mappings, req.user.id);
  }

  @Get('matches')
  getMatches() {
    return this.adminService.getMatches();
  }

  @Patch('matches/:id/datetime')
  updateMatchDateTime(@Param('id') id: string, @Body('match_datetime') dt: string) {
    return this.adminService.updateMatch(id, { match_datetime: new Date(dt) });
  }

  @Patch('matches/:id/open-bets')
  openMatchBets(@Param('id') id: string, @Body('is_betting_open') open: boolean) {
    return this.adminService.updateMatch(id, { is_betting_open: open });
  }

  @Patch('matches/:id/result')
  saveMatchResult(@Param('id') id: string, @Body() data: any, @Request() req: any) {
    return this.adminService.saveMatchResult(id, data, req.user.id);
  }

  @Post('matches/mass-result')
  saveMassMatchResults(@Body('results') results: any[], @Request() req: any) {
    return this.adminService.saveMassMatchResults(results, req.user.id);
  }

  @Post('knockout/calculate-scores')
  calculateKnockoutScores(@Body('phase') phase: string, @Request() req: any) {
    return this.adminService.calculateKnockoutScores(req.user.id, phase);
  }

  @Post('factory-reset')
  factoryReset(@Request() req: any) {
    return this.adminService.factoryReset(req.user.id);
  }
}
