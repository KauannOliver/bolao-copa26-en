import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PredictionsService {
  constructor(private prisma: PrismaService) {}

  async getSettings() {
    return this.prisma.poolSetting.findFirst();
  }

  async getMatches() {
    return this.prisma.match.findMany({
      include: {
        TeamA: true,
        TeamB: true
      },
      orderBy: {
        fifa_match_number: 'asc'
      }
    });
  }

  async getGroupPredictions(userId: string) {
    return this.prisma.groupPrediction.findMany({
      where: { user_id: userId },
      include: { Team: true, Group: true }
    });
  }

  async saveGroupPredictions(userId: string, predictions: { group_id: string, team_id: string, predicted_position: number }[]) {
    // Check deadline
    const settings = await this.prisma.poolSetting.findFirst();
    if (settings && new Date() > settings.group_stage_deadline) {
      throw new ForbiddenException('Palpites da fase de grupos estão encerrados.');
    }

    // Validate 3 distinct positions per group
    const grouped: Record<string, any[]> = {};
    for (const p of predictions) {
      if (!grouped[p.group_id]) grouped[p.group_id] = [];
      grouped[p.group_id].push(p);
    }

    for (const groupId in grouped) {
      const gPreds = grouped[groupId];
      if (gPreds.length !== 4) {
        throw new BadRequestException(`Cada grupo deve ter exatamente 4 seleções. Grupo ${groupId} tem ${gPreds.length}`);
      }
      const teams = new Set(gPreds.map(p => p.team_id));
      if (teams.size !== 4) {
        throw new BadRequestException('Não pode repetir seleção no mesmo grupo.');
      }
    }

    await this.prisma.$transaction(async (tx) => {
      // Clear existing
      await tx.groupPrediction.deleteMany({
        where: { user_id: userId, group_id: { in: Object.keys(grouped) } }
      });
      // Insert new
      await tx.groupPrediction.createMany({
        data: predictions.map(p => ({
          user_id: userId,
          group_id: p.group_id,
          team_id: p.team_id,
          predicted_position: p.predicted_position
        }))
      });
    });

    return { message: 'Palpites salvos com sucesso' };
  }

  async getKnockoutPredictions(userId: string) {
    return this.prisma.knockoutPrediction.findMany({
      where: { user_id: userId }
    });
  }

  async saveMassKnockoutPredictions(userId: string, phase: string, predictions: any[]) {
    const settings = await this.prisma.poolSetting.findFirst();
    if (!settings) throw new BadRequestException('Configurações não encontradas');

    let deadline: Date | null = null;
    let visible = false;

    switch (phase) {
      case 'ROUND_OF_32': deadline = settings.r32_deadline; visible = settings.r32_visible; break;
      case 'ROUND_OF_16': deadline = settings.r16_deadline; visible = settings.r16_visible; break;
      case 'QUARTER_FINAL': deadline = settings.qf_deadline; visible = settings.qf_visible; break;
      case 'SEMI_FINAL': deadline = settings.sf_deadline; visible = settings.sf_visible; break;
      case 'THIRD_PLACE': deadline = settings.third_deadline; visible = settings.third_visible; break;
      case 'FINAL': deadline = settings.final_deadline; visible = settings.final_visible; break;
      default: throw new BadRequestException('Fase inválida');
    }

    if (!visible) throw new ForbiddenException('Esta fase não está visível para apostas.');
    if (deadline && new Date() > deadline) throw new ForbiddenException('A data limite para apostas desta fase já passou.');

    await this.prisma.$transaction(async (tx) => {
      for (const p of predictions) {
        const match = await tx.match.findUnique({ where: { id: p.match_id } });
        if (!match) continue;
        if (match.stage !== phase) continue;

        const isTie = p.predicted_goals_team_a === p.predicted_goals_team_b;
        if (p.predicted_goals_team_a < 0 || p.predicted_goals_team_b < 0) {
          throw new BadRequestException('Os gols não podem ser negativos');
        }
        if (isTie && !p.predicted_winner_team_id) {
          throw new BadRequestException('Em caso de empate, é obrigatório informar o vencedor (classificado nos pênaltis).');
        }
        
        const winnerId = isTie ? p.predicted_winner_team_id : (p.predicted_goals_team_a > p.predicted_goals_team_b ? match.team_a_id : match.team_b_id);

        await tx.knockoutPrediction.upsert({
          where: { user_id_match_id: { user_id: userId, match_id: p.match_id } },
          update: {
            predicted_goals_team_a: p.predicted_goals_team_a,
            predicted_goals_team_b: p.predicted_goals_team_b,
            predicted_winner_team_id: winnerId
          },
          create: {
            user_id: userId,
            match_id: p.match_id,
            predicted_goals_team_a: p.predicted_goals_team_a,
            predicted_goals_team_b: p.predicted_goals_team_b,
            predicted_winner_team_id: winnerId
          }
        });
      }
    });

    return { message: 'Palpites salvos com sucesso!' };
  }
}
