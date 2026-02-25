-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "appVersion" TEXT,
ADD COLUMN     "unitConfig" JSONB;

-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "rating" INTEGER;
