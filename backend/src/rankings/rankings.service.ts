import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RankingsService {
  constructor(private prisma: PrismaService) {}

  async getRanking() {
    const users = await this.prisma.user.findMany({
      where: { role: { in: ['BETTOR', 'ADMIN'] } },
      select: { id: true, name: true, ScoreDetail: { select: { points: true, stage: true } } }
    });

    const processRanking = (stage: string) => {
      const ranking = users.map(u => {
        const totalPoints = u.ScoreDetail.filter(s => s.stage === stage).reduce((acc, curr) => acc + curr.points, 0);
        return {
          id: u.id,
          name: u.name,
          totalPoints
        };
      });

      ranking.sort((a, b) => b.totalPoints - a.totalPoints);
      
      let currentPos = 1;
      let currentRank = 1;
      let prevScore = -1;

      for (const r of ranking) {
        if (r.totalPoints !== prevScore) {
          currentRank = currentPos;
        }
        (r as any).position = currentRank;
        prevScore = r.totalPoints;
        currentPos++;
      }

      return ranking;
    };

    return {
      groupStage: processRanking('GROUP_STAGE'),
      knockout: processRanking('KNOCKOUT')
    };
  }
}
