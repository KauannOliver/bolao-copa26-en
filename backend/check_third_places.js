const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const count = await prisma.thirdPlaceMappingOption.count();
  console.log(`ThirdPlaceMappingOption count: ${count}`);
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
