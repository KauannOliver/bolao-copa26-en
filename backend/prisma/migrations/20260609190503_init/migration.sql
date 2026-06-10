-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PENDING', 'BETTOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MatchStage" AS ENUM ('ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('WAITING_TEAMS', 'SCHEDULED', 'OPEN_FOR_BETS', 'LOCKED', 'FINISHED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PENDING',
    "status" "Status" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "approved_at" TIMESTAMP(3),
    "approved_by" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoolSetting" (
    "id" TEXT NOT NULL,
    "group_stage_deadline" TIMESTAMP(3) NOT NULL,
    "group_stage_results_locked" BOOLEAN NOT NULL DEFAULT false,
    "knockout_generated" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PoolSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "letter" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "short_name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "draw_position" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupPrediction" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "predicted_position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupPrediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficialGroupResult" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "official_position" INTEGER NOT NULL,
    "points_optional" INTEGER,
    "goals_for_optional" INTEGER,
    "goals_against_optional" INTEGER,
    "goal_difference_optional" INTEGER,
    "is_third_place_qualified" BOOLEAN NOT NULL DEFAULT false,
    "third_place_rank_optional" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfficialGroupResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "fifa_match_number" INTEGER NOT NULL,
    "stage" "MatchStage" NOT NULL,
    "team_a_id" TEXT,
    "team_b_id" TEXT,
    "source_a_type" TEXT,
    "source_a_ref" TEXT,
    "source_b_type" TEXT,
    "source_b_ref" TEXT,
    "match_datetime" TIMESTAMP(3),
    "is_betting_open" BOOLEAN NOT NULL DEFAULT false,
    "status" "MatchStatus" NOT NULL DEFAULT 'WAITING_TEAMS',
    "goals_team_a" INTEGER,
    "goals_team_b" INTEGER,
    "winner_team_id" TEXT,
    "loser_team_id" TEXT,
    "had_penalties" BOOLEAN NOT NULL DEFAULT false,
    "penalties_team_a" INTEGER,
    "penalties_team_b" INTEGER,
    "next_match_id" TEXT,
    "next_match_slot" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnockoutPrediction" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "predicted_goals_team_a" INTEGER NOT NULL,
    "predicted_goals_team_b" INTEGER NOT NULL,
    "predicted_winner_team_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnockoutPrediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoreDetail" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "group_id" TEXT,
    "match_id" TEXT,
    "team_id" TEXT,
    "predicted_position" INTEGER,
    "official_position" INTEGER,
    "predicted_score" TEXT,
    "official_score" TEXT,
    "points" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScoreDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT,
    "old_value" TEXT,
    "new_value" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThirdPlaceMappingOption" (
    "id" TEXT NOT NULL,
    "combination_key" TEXT NOT NULL,
    "m74_group" TEXT NOT NULL,
    "m77_group" TEXT NOT NULL,
    "m79_group" TEXT NOT NULL,
    "m80_group" TEXT NOT NULL,
    "m81_group" TEXT NOT NULL,
    "m82_group" TEXT NOT NULL,
    "m85_group" TEXT NOT NULL,
    "m87_group" TEXT NOT NULL,

    CONSTRAINT "ThirdPlaceMappingOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Group_letter_key" ON "Group"("letter");

-- CreateIndex
CREATE UNIQUE INDEX "Team_code_key" ON "Team"("code");

-- CreateIndex
CREATE UNIQUE INDEX "GroupPrediction_user_id_group_id_team_id_key" ON "GroupPrediction"("user_id", "group_id", "team_id");

-- CreateIndex
CREATE UNIQUE INDEX "GroupPrediction_user_id_group_id_predicted_position_key" ON "GroupPrediction"("user_id", "group_id", "predicted_position");

-- CreateIndex
CREATE UNIQUE INDEX "OfficialGroupResult_group_id_team_id_key" ON "OfficialGroupResult"("group_id", "team_id");

-- CreateIndex
CREATE UNIQUE INDEX "OfficialGroupResult_group_id_official_position_key" ON "OfficialGroupResult"("group_id", "official_position");

-- CreateIndex
CREATE UNIQUE INDEX "Match_fifa_match_number_key" ON "Match"("fifa_match_number");

-- CreateIndex
CREATE UNIQUE INDEX "KnockoutPrediction_user_id_match_id_key" ON "KnockoutPrediction"("user_id", "match_id");

-- CreateIndex
CREATE UNIQUE INDEX "ThirdPlaceMappingOption_combination_key_key" ON "ThirdPlaceMappingOption"("combination_key");

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupPrediction" ADD CONSTRAINT "GroupPrediction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupPrediction" ADD CONSTRAINT "GroupPrediction_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupPrediction" ADD CONSTRAINT "GroupPrediction_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficialGroupResult" ADD CONSTRAINT "OfficialGroupResult_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficialGroupResult" ADD CONSTRAINT "OfficialGroupResult_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_team_a_id_fkey" FOREIGN KEY ("team_a_id") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_team_b_id_fkey" FOREIGN KEY ("team_b_id") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_winner_team_id_fkey" FOREIGN KEY ("winner_team_id") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_loser_team_id_fkey" FOREIGN KEY ("loser_team_id") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnockoutPrediction" ADD CONSTRAINT "KnockoutPrediction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnockoutPrediction" ADD CONSTRAINT "KnockoutPrediction_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnockoutPrediction" ADD CONSTRAINT "KnockoutPrediction_predicted_winner_team_id_fkey" FOREIGN KEY ("predicted_winner_team_id") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreDetail" ADD CONSTRAINT "ScoreDetail_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreDetail" ADD CONSTRAINT "ScoreDetail_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreDetail" ADD CONSTRAINT "ScoreDetail_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreDetail" ADD CONSTRAINT "ScoreDetail_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
