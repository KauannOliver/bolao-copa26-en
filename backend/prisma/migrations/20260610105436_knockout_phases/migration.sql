-- AlterTable
ALTER TABLE "PoolSetting" ADD COLUMN     "final_deadline" TIMESTAMP(3),
ADD COLUMN     "final_visible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "qf_deadline" TIMESTAMP(3),
ADD COLUMN     "qf_visible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "r16_deadline" TIMESTAMP(3),
ADD COLUMN     "r16_visible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "r32_deadline" TIMESTAMP(3),
ADD COLUMN     "r32_visible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sf_deadline" TIMESTAMP(3),
ADD COLUMN     "sf_visible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "third_deadline" TIMESTAMP(3),
ADD COLUMN     "third_visible" BOOLEAN NOT NULL DEFAULT false;
