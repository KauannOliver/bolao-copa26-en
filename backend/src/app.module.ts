import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { GroupsModule } from './groups/groups.module';
import { PredictionsModule } from './predictions/predictions.module';
import { AdminModule } from './admin/admin.module';
import { RankingsModule } from './rankings/rankings.module';

@Module({
  imports: [AuthModule, PrismaModule, UsersModule, GroupsModule, PredictionsModule, AdminModule, RankingsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
