-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('LOBBY', 'PLACEMENT', 'ACTIVE', 'COMPLETED', 'ABANDONED');

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "boardWidth" INTEGER NOT NULL DEFAULT 22,
    "boardLength" INTEGER NOT NULL DEFAULT 21,
    "placementZone" INTEGER NOT NULL DEFAULT 5,
    "unitsCount" INTEGER NOT NULL DEFAULT 5,
    "currentRound" INTEGER NOT NULL DEFAULT 0,
    "currentStep" INTEGER NOT NULL DEFAULT -5,
    "status" "GameStatus" NOT NULL DEFAULT 'LOBBY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "playerNumber" INTEGER NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "socketId" TEXT,
    "isReady" BOOLEAN NOT NULL DEFAULT false,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "units" JSONB NOT NULL,
    "futureUnits" JSONB,
    "flag" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Game_roomId_key" ON "Game"("roomId");

-- CreateIndex
CREATE INDEX "Game_roomId_idx" ON "Game"("roomId");

-- CreateIndex
CREATE INDEX "Game_status_lastActivity_idx" ON "Game"("status", "lastActivity");

-- CreateIndex
CREATE UNIQUE INDEX "Player_sessionToken_key" ON "Player"("sessionToken");

-- CreateIndex
CREATE INDEX "Player_sessionToken_idx" ON "Player"("sessionToken");

-- CreateIndex
CREATE INDEX "Player_socketId_idx" ON "Player"("socketId");

-- CreateIndex
CREATE UNIQUE INDEX "Player_gameId_playerNumber_key" ON "Player"("gameId", "playerNumber");

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
