import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PredictionsService } from './predictions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('BETTOR', 'ADMIN')
@Controller('predictions')
export class PredictionsController {
  constructor(private predictionsService: PredictionsService) {}

  @Get('settings')
  getSettings() {
    return this.predictionsService.getSettings();
  }

  @Get('matches')
  getMatches() {
    return this.predictionsService.getMatches();
  }

  @Get('group-stage/me')
  getGroupPredictions(@Request() req: any) {
    return this.predictionsService.getGroupPredictions(req.user.id);
  }

  @Post('group-stage')
  saveGroupPredictions(@Body() body: any, @Request() req: any) {
    return this.predictionsService.saveGroupPredictions(req.user.id, body.predictions);
  }

  @Put('group-stage')
  updateGroupPredictions(@Body() body: any, @Request() req: any) {
    return this.predictionsService.saveGroupPredictions(req.user.id, body.predictions);
  }

  @Get('knockout/me')
  getKnockoutPredictions(@Request() req: any) {
    return this.predictionsService.getKnockoutPredictions(req.user.id);
  }

  @Post('knockout/mass-save')
  saveMassKnockoutPredictions(@Body() body: { phase: string, predictions: any[] }, @Request() req: any) {
    return this.predictionsService.saveMassKnockoutPredictions(req.user.id, body.phase, body.predictions);
  }
}
