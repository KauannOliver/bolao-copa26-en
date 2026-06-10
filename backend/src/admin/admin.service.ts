import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getSettings() {
    return this.prisma.poolSetting.findFirst();
  }

  async getGroupResults() {
    return this.prisma.officialGroupResult.findMany();
  }

  async setGroupDeadline(deadline: Date, adminId: string) {
    const settings = await this.prisma.poolSetting.findFirst();
    const oldDeadline = settings?.group_stage_deadline;
    
    let updated;
    if (settings) {
      updated = await this.prisma.poolSetting.update({
        where: { id: settings.id },
        data: { group_stage_deadline: deadline }
      });
    } else {
      updated = await this.prisma.poolSetting.create({
        data: { group_stage_deadline: deadline }
      });
    }

    await this.prisma.auditLog.create({
      data: {
        user_id: adminId,
        action: 'UPDATE_DEADLINE',
        entity: 'PoolSetting',
        old_value: oldDeadline ? oldDeadline.toISOString() : null,
        new_value: deadline.toISOString()
      }
    });

    return updated;
  }

  async updateKnockoutSettings(data: any, adminId: string) {
    const settings = await this.prisma.poolSetting.findFirst();
    if (!settings) throw new BadRequestException('Settings not initialized');
    
    const updated = await this.prisma.poolSetting.update({
      where: { id: settings.id },
      data: {
        r32_deadline: data.r32_deadline ? new Date(data.r32_deadline) : null,
        r32_visible: data.r32_visible ?? false,
        r16_deadline: data.r16_deadline ? new Date(data.r16_deadline) : null,
        r16_visible: data.r16_visible ?? false,
        qf_deadline: data.qf_deadline ? new Date(data.qf_deadline) : null,
        qf_visible: data.qf_visible ?? false,
        sf_deadline: data.sf_deadline ? new Date(data.sf_deadline) : null,
        sf_visible: data.sf_visible ?? false,
        third_deadline: data.third_deadline ? new Date(data.third_deadline) : null,
        third_visible: data.third_visible ?? false,
        final_deadline: data.final_deadline ? new Date(data.final_deadline) : null,
        final_visible: data.final_visible ?? false,
      }
    });

    await this.prisma.auditLog.create({
      data: {
        user_id: adminId,
        action: 'UPDATE_KNOCKOUT_SETTINGS',
        entity: 'PoolSetting'
      }
    });

    return updated;
  }

  async saveGroupResults(results: { group_id: string, team_id: string, official_position: number, is_third_place_qualified?: boolean }[], adminId: string) {
    await this.prisma.$transaction(async (tx) => {
      for (const res of results) {
        await tx.officialGroupResult.upsert({
          where: { group_id_team_id: { group_id: res.group_id, team_id: res.team_id } },
          update: { official_position: res.official_position, is_third_place_qualified: res.is_third_place_qualified || false },
          create: {
            group_id: res.group_id,
            team_id: res.team_id,
            official_position: res.official_position,
            is_third_place_qualified: res.is_third_place_qualified || false
          }
        });
      }
    });

    await this.prisma.auditLog.create({
      data: {
        user_id: adminId,
        action: 'SAVE_GROUP_RESULTS',
        entity: 'OfficialGroupResult',
        new_value: JSON.stringify(results)
      }
    });

    return { message: 'Resultados salvos com sucesso' };
  }

  async calculateGroupScores(adminId: string) {
    const predictions = await this.prisma.groupPrediction.findMany({ include: { Team: true } });
    const results = await this.prisma.officialGroupResult.findMany();

    const resultsMap = new Map();
    for (const r of results) {
      resultsMap.set(`${r.group_id}_${r.team_id}`, r.official_position);
    }

    const groupTeamsMap = new Map();
    for (const r of results) {
      if (!groupTeamsMap.has(r.group_id)) groupTeamsMap.set(r.group_id, new Set());
      if (r.official_position <= 3) {
        groupTeamsMap.get(r.group_id).add(r.team_id);
      }
    }

    await this.prisma.scoreDetail.deleteMany({ where: { stage: 'GROUP_STAGE' } });

    const scoreDetails = [];
    for (const p of predictions) {
      const officialPos = resultsMap.get(`${p.group_id}_${p.team_id}`);
      let points = 0;
      let reason = 'Não pontuou';

      const top3Teams = groupTeamsMap.get(p.group_id);
      
      if (officialPos && officialPos === p.predicted_position) {
        points = 3;
        reason = 'Posição exata';
      } else if (top3Teams && top3Teams.has(p.team_id)) {
        points = 1;
        reason = 'Acertou o time no top 3, mas errou a posição';
      }

      scoreDetails.push({
        user_id: p.user_id,
        stage: 'GROUP_STAGE',
        group_id: p.group_id,
        team_id: p.team_id,
        predicted_position: p.predicted_position,
        official_position: officialPos || null,
        points,
        reason
      });
    }

    if (scoreDetails.length > 0) {
      await this.prisma.scoreDetail.createMany({ data: scoreDetails });
    }

    await this.prisma.auditLog.create({
      data: { user_id: adminId, action: 'CALCULATE_GROUP_SCORES', entity: 'ScoreDetail' }
    });

    const thirdPlaces = await this.prisma.officialGroupResult.findMany({
      where: { is_third_place_qualified: true },
      include: { Group: true }
    });
    
    if (thirdPlaces.length !== 8) {
      throw new BadRequestException(`Você deve classificar exatamente 8 terceiros colocados antes de calcular os pontos e gerar o mata-mata. Atualmente tem ${thirdPlaces.length} classificados.`);
    }
    
    // Sort by group letter alphabetically
    thirdPlaces.sort((a, b) => a.Group.letter.localeCompare(b.Group.letter));

    const slots = [74, 77, 79, 80, 81, 82, 85, 87];
    const mappings = thirdPlaces.map((tp, idx) => ({
      groupLetter: tp.Group.letter,
      matchNumber: slots[idx] || 0
    })).filter(m => m.matchNumber !== 0);

    // Automatically generate the knockout bracket
    await this.generateRoundOf32(mappings, adminId);

    return { message: 'Pontuações calculadas e chaveamento inicial gerado com sucesso!' };
  }

  async generateRoundOf32(thirdPlaceMappings: { groupLetter: string, matchNumber: number }[], adminId: string) {
    const results = await this.prisma.officialGroupResult.findMany({ include: { Group: true, Team: true } });
    
    // Group letter -> Team ID
    const getTeamId = (groupLetter: string, position: number) => {
      const r = results.find(res => res.Group.letter === groupLetter && res.official_position === position);
      return r?.team_id || null;
    };

    const thirdPlaceMap = new Map(); // matchNumber -> teamId
    for (const m of thirdPlaceMappings) {
      thirdPlaceMap.set(m.matchNumber, getTeamId(m.groupLetter, 3));
    }

    const matchesData = [
      { num: 73, ta: getTeamId('A', 2), tb: getTeamId('B', 2) },
      { num: 74, ta: getTeamId('E', 1), tb: thirdPlaceMap.get(74) },
      { num: 75, ta: getTeamId('F', 1), tb: getTeamId('C', 2) },
      { num: 76, ta: getTeamId('C', 1), tb: getTeamId('F', 2) },
      { num: 77, ta: getTeamId('I', 1), tb: thirdPlaceMap.get(77) },
      { num: 78, ta: getTeamId('E', 2), tb: getTeamId('I', 2) },
      { num: 79, ta: getTeamId('A', 1), tb: thirdPlaceMap.get(79) },
      { num: 80, ta: getTeamId('L', 1), tb: thirdPlaceMap.get(80) },
      { num: 81, ta: getTeamId('D', 1), tb: thirdPlaceMap.get(81) },
      { num: 82, ta: getTeamId('G', 1), tb: thirdPlaceMap.get(82) },
      { num: 83, ta: getTeamId('K', 2), tb: getTeamId('L', 2) },
      { num: 84, ta: getTeamId('H', 1), tb: getTeamId('J', 2) },
      { num: 85, ta: getTeamId('B', 1), tb: thirdPlaceMap.get(85) },
      { num: 86, ta: getTeamId('J', 1), tb: getTeamId('H', 2) },
      { num: 87, ta: getTeamId('K', 1), tb: thirdPlaceMap.get(87) },
      { num: 88, ta: getTeamId('D', 2), tb: getTeamId('G', 2) },
    ];

    await this.prisma.$transaction(async (tx) => {
      // Create Round of 32
      for (const m of matchesData) {
        await tx.match.upsert({
          where: { fifa_match_number: m.num },
          update: { team_a_id: m.ta, team_b_id: m.tb, stage: 'ROUND_OF_32', status: m.ta && m.tb ? 'SCHEDULED' : 'WAITING_TEAMS' },
          create: { fifa_match_number: m.num, team_a_id: m.ta, team_b_id: m.tb, stage: 'ROUND_OF_32', status: m.ta && m.tb ? 'SCHEDULED' : 'WAITING_TEAMS' }
        });
      }

      // Create empty subsequent matches
      const emptyMatches = [
        ...[89, 90, 91, 92, 93, 94, 95, 96].map(num => ({ num, stage: 'ROUND_OF_16' })),
        ...[97, 98, 99, 100].map(num => ({ num, stage: 'QUARTER_FINAL' })),
        ...[101, 102].map(num => ({ num, stage: 'SEMI_FINAL' })),
        { num: 103, stage: 'THIRD_PLACE' },
        { num: 104, stage: 'FINAL' }
      ];

      for (const m of emptyMatches) {
        await tx.match.upsert({
          where: { fifa_match_number: m.num },
          update: { stage: m.stage as any },
          create: { fifa_match_number: m.num, stage: m.stage as any }
        });
      }
    });

    return { message: 'Chaveamento gerado' };
  }

  async getMatches() {
    return this.prisma.match.findMany({ include: { TeamA: true, TeamB: true }, orderBy: { fifa_match_number: 'asc' } });
  }

  async updateMatch(matchId: string, data: any) {
    return this.prisma.match.update({
      where: { id: matchId },
      data
    });
  }

  async saveMatchResult(matchId: string, data: any, adminId: string) {
    if (data.goals_team_a < 0 || data.goals_team_b < 0) {
      throw new BadRequestException('Os gols não podem ser negativos');
    }
    const updated = await this.prisma.match.update({
      where: { id: matchId },
      data: {
        goals_team_a: data.goals_team_a,
        goals_team_b: data.goals_team_b,
        winner_team_id: data.winner_team_id,
        loser_team_id: data.loser_team_id,
        had_penalties: data.had_penalties || false,
        penalties_team_a: data.penalties_team_a,
        penalties_team_b: data.penalties_team_b,
        status: 'FINISHED'
      }
    });

    await this.prisma.auditLog.create({
      data: { user_id: adminId, action: 'SAVE_MATCH_RESULT', entity: 'Match', entity_id: matchId, new_value: JSON.stringify(data) }
    });

    return updated;
  }

  async saveMassMatchResults(results: any[], adminId: string) {
    for (const res of results) {
      if (res.goals_team_a < 0 || res.goals_team_b < 0) {
        throw new BadRequestException('Os gols não podem ser negativos');
      }
    }
    await this.prisma.$transaction(async (tx) => {
      for (const res of results) {
        await tx.match.update({
          where: { id: res.match_id },
          data: {
            goals_team_a: res.goals_team_a,
            goals_team_b: res.goals_team_b,
            winner_team_id: res.winner_team_id,
            loser_team_id: res.loser_team_id,
            had_penalties: res.had_penalties || false,
            penalties_team_a: res.penalties_team_a,
            penalties_team_b: res.penalties_team_b,
            status: 'FINISHED'
          }
        });
      }
    });

    await this.prisma.auditLog.create({
      data: { user_id: adminId, action: 'SAVE_MASS_MATCH_RESULT', entity: 'Match' }
    });

    return { message: 'Resultados salvos com sucesso' };
  }

  private async autoAdvance(match: any) {
    const mappings = {
      74: { next: 89, slot: 'A' }, 77: { next: 89, slot: 'B' },
      73: { next: 90, slot: 'A' }, 75: { next: 90, slot: 'B' },
      76: { next: 91, slot: 'A' }, 78: { next: 91, slot: 'B' },
      79: { next: 92, slot: 'A' }, 80: { next: 92, slot: 'B' },
      83: { next: 93, slot: 'A' }, 84: { next: 93, slot: 'B' },
      81: { next: 94, slot: 'A' }, 82: { next: 94, slot: 'B' },
      86: { next: 95, slot: 'A' }, 88: { next: 95, slot: 'B' },
      85: { next: 96, slot: 'A' }, 87: { next: 96, slot: 'B' },
      89: { next: 97, slot: 'A' }, 90: { next: 97, slot: 'B' },
      93: { next: 98, slot: 'A' }, 94: { next: 98, slot: 'B' },
      91: { next: 99, slot: 'A' }, 92: { next: 99, slot: 'B' },
      95: { next: 100, slot: 'A' }, 96: { next: 100, slot: 'B' },
      97: { next: 101, slot: 'A' }, 98: { next: 101, slot: 'B' },
      99: { next: 102, slot: 'A' }, 100: { next: 102, slot: 'B' },
    };

    const map = (mappings as any)[match.fifa_match_number];
    if (map && match.winner_team_id) {
      const nextMatch = await this.prisma.match.findUnique({ where: { fifa_match_number: map.next } });
      if (nextMatch) {
        await this.prisma.match.update({
          where: { id: nextMatch.id },
          data: {
            [map.slot === 'A' ? 'team_a_id' : 'team_b_id']: match.winner_team_id,
            status: (nextMatch.team_a_id || map.slot === 'A') && (nextMatch.team_b_id || map.slot === 'B') ? 'SCHEDULED' : 'WAITING_TEAMS'
          }
        });
      }
    }

    // Lógica para disputa de 3o lugar
    if (match.fifa_match_number === 101 || match.fifa_match_number === 102) {
      const thirdPlaceMatch = await this.prisma.match.findUnique({ where: { fifa_match_number: 103 } });
      const finalMatch = await this.prisma.match.findUnique({ where: { fifa_match_number: 104 } });
      const slot = match.fifa_match_number === 101 ? 'team_a_id' : 'team_b_id';
      
      if (finalMatch && match.winner_team_id) {
        await this.prisma.match.update({ where: { id: finalMatch.id }, data: { [slot]: match.winner_team_id }});
      }
      if (thirdPlaceMatch && match.loser_team_id) {
        await this.prisma.match.update({ where: { id: thirdPlaceMatch.id }, data: { [slot]: match.loser_team_id }});
      }
    }
  }

  async calculateKnockoutScores(adminId: string, phase?: string) {
    const predictionsQuery = phase ? { Match: { stage: phase as any } } : undefined;
    const matchesQuery = phase ? { status: 'FINISHED' as any, stage: phase as any } : { status: 'FINISHED' as any };

    const predictions = await this.prisma.knockoutPrediction.findMany({ where: predictionsQuery });
    const matches = await this.prisma.match.findMany({ where: matchesQuery });
    const matchesMap = new Map(matches.map(m => [m.id, m]));

    if (phase) {
      await this.prisma.scoreDetail.deleteMany({
        where: { stage: 'KNOCKOUT', Match: { stage: phase as any } }
      });
    } else {
      await this.prisma.scoreDetail.deleteMany({ where: { stage: 'KNOCKOUT' } });
    }

    const scoreDetails = [];
    for (const p of predictions) {
      const m = matchesMap.get(p.match_id);
      if (!m) continue;

      let points = 0;
      let reason = 'Não pontuou';

      const predTie = p.predicted_goals_team_a === p.predicted_goals_team_b;
      const matchTie = m.goals_team_a === m.goals_team_b;
      
      const predDiff = p.predicted_goals_team_a - p.predicted_goals_team_b;
      const matchDiff = (m.goals_team_a || 0) - (m.goals_team_b || 0);
      
      const predWinner = predTie ? p.predicted_winner_team_id : (predDiff > 0 ? m.team_a_id : m.team_b_id);
      const matchWinner = m.winner_team_id;

      if (p.predicted_goals_team_a === m.goals_team_a && p.predicted_goals_team_b === m.goals_team_b) {
        points = 10;
        reason = 'Placar exato';
      } else if (predTie && matchTie) {
        points = 5;
        reason = 'Empate não exato';
      } else if (predWinner === matchWinner && predDiff === matchDiff) {
        points = 6;
        reason = 'Vencedor + saldo de gols';
      } else if (predWinner === matchWinner && 
                ((predWinner === m.team_a_id && p.predicted_goals_team_a === m.goals_team_a) || 
                 (predWinner === m.team_b_id && p.predicted_goals_team_b === m.goals_team_b))) {
        points = 5;
        reason = 'Vencedor + gols do vencedor';
      } else if (predWinner === matchWinner) {
        points = 4;
        reason = 'Apenas vencedor';
      }

      scoreDetails.push({
        user_id: p.user_id,
        stage: 'KNOCKOUT',
        match_id: p.match_id,
        predicted_score: `${p.predicted_goals_team_a}x${p.predicted_goals_team_b}`,
        official_score: `${m.goals_team_a}x${m.goals_team_b}`,
        points,
        reason
      });
    }

    if (scoreDetails.length > 0) {
      await this.prisma.scoreDetail.createMany({ data: scoreDetails });
    }

    await this.prisma.auditLog.create({
      data: { user_id: adminId, action: 'CALCULATE_KNOCKOUT_SCORES', entity: 'ScoreDetail' }
    });

    for (const m of matches) {
      await this.autoAdvance(m);
    }

    return { message: 'Pontuações calculadas e chaveamento atualizado com sucesso!' };
  }

  async factoryReset(adminId: string) {
    await this.prisma.$transaction([
      this.prisma.scoreDetail.deleteMany({}),
      this.prisma.knockoutPrediction.deleteMany({}),
      this.prisma.groupPrediction.deleteMany({}),
      this.prisma.officialGroupResult.deleteMany({}),
      
      this.prisma.match.updateMany({
        data: {
          goals_team_a: null,
          goals_team_b: null,
          winner_team_id: null,
          loser_team_id: null,
          penalties_team_a: null,
          penalties_team_b: null,
          had_penalties: false,
          team_a_id: null,
          team_b_id: null,
          status: 'WAITING_TEAMS'
        }
      })
    ]);

    await this.prisma.auditLog.create({
      data: { user_id: adminId, action: 'FACTORY_RESET', entity: 'System' }
    });

    return { message: 'Bolão resetado com sucesso' };
  }
}
