import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const games = await prisma.game.findMany({ include: { players: true } });
  const players = await prisma.player.findMany();

  console.log('\n📊 Current Database State:');
  console.log(`   Games: ${games.length}`);
  console.log(`   Players: ${players.length}`);

  if (games.length > 0) {
    console.log('\n📋 Games in Database:');
    games.forEach(g => {      console.log(`   - Room: "${g.roomId}" | Status: ${g.status} | Players: ${g.players.length}`);
    });
  }

  if (players.length > 0) {
    console.log('\n👥 Players in Database:');
    players.forEach(p => {
      const socketStatus = p.socketId ? '✅ Active' : '❌ Disconnected';
      console.log(`   - P${p.playerNumber} | Token: ${p.sessionToken.slice(0, 8)}... | ${socketStatus}`);
    });
  }

  await prisma.$disconnect();
}

main();
