import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Configurações Iniciais
  const poolSettingsCount = await prisma.poolSetting.count();
  if (poolSettingsCount === 0) {
    await prisma.poolSetting.create({
      data: {
        group_stage_deadline: new Date('2026-06-10T12:00:00Z'), // Exemplo
        group_stage_results_locked: false,
        knockout_generated: false,
      },
    });
    console.log('Configurações iniciais criadas.');
  }

  // Create the first administrator only when one does not already exist.
  const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
  if (adminCount === 0) {
    const adminEmail = process.env.FIRST_ADMIN_EMAIL?.trim();
    const adminPasswordRaw = process.env.FIRST_ADMIN_PASSWORD;
    if (!adminEmail || !adminPasswordRaw || adminPasswordRaw.length < 16) {
      throw new Error(
        'Set FIRST_ADMIN_EMAIL and a FIRST_ADMIN_PASSWORD with at least 16 characters before seeding the first administrator.',
      );
    }

    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });
    if (existingAdmin) {
      throw new Error('FIRST_ADMIN_EMAIL is already registered without an administrator role.');
    }

    const password_hash = await bcrypt.hash(adminPasswordRaw, 10);
    await prisma.user.create({
      data: {
        name: 'Administrador do Sistema',
        email: adminEmail,
        password_hash,
        role: 'ADMIN',
        status: 'APPROVED',
      },
    });
    console.log(`Admin criado: ${adminEmail}`);
  } else {
    console.log('Administrator already exists; skipping initial administrator creation.');
  }

  // Grupos e Seleções
  const groupsData = [
    {
      letter: 'A',
      name: 'Grupo A',
      teams: [
        { name: 'México', short_name: 'MEX', code: 'MEX' },
        { name: 'África do Sul', short_name: 'RSA', code: 'RSA' },
        { name: 'Coreia do Sul', short_name: 'KOR', code: 'KOR' },
        { name: 'Tchéquia', short_name: 'CZE', code: 'CZE' },
      ],
    },
    {
      letter: 'B',
      name: 'Grupo B',
      teams: [
        { name: 'Canadá', short_name: 'CAN', code: 'CAN' },
        { name: 'Bósnia e Herzegovina', short_name: 'BIH', code: 'BIH' },
        { name: 'Catar', short_name: 'QAT', code: 'QAT' },
        { name: 'Suíça', short_name: 'SUI', code: 'SUI' },
      ],
    },
    {
      letter: 'C',
      name: 'Grupo C',
      teams: [
        { name: 'Escócia', short_name: 'SCO', code: 'SCO' },
        { name: 'Brasil', short_name: 'BRA', code: 'BRA' },
        { name: 'Marrocos', short_name: 'MAR', code: 'MAR' },
        { name: 'Haiti', short_name: 'HAI', code: 'HAI' },
      ],
    },
    {
      letter: 'D',
      name: 'Grupo D',
      teams: [
        { name: 'Estados Unidos', short_name: 'USA', code: 'USA' },
        { name: 'Paraguai', short_name: 'PAR', code: 'PAR' },
        { name: 'Austrália', short_name: 'AUS', code: 'AUS' },
        { name: 'Turquia', short_name: 'TUR', code: 'TUR' },
      ],
    },
    {
      letter: 'E',
      name: 'Grupo E',
      teams: [
        { name: 'Alemanha', short_name: 'GER', code: 'GER' },
        { name: 'Curaçao', short_name: 'CUW', code: 'CUW' },
        { name: 'Costa do Marfim', short_name: 'CIV', code: 'CIV' },
        { name: 'Equador', short_name: 'ECU', code: 'ECU' },
      ],
    },
    {
      letter: 'F',
      name: 'Grupo F',
      teams: [
        { name: 'Holanda', short_name: 'NED', code: 'NED' },
        { name: 'Japão', short_name: 'JPN', code: 'JPN' },
        { name: 'Suécia', short_name: 'SWE', code: 'SWE' },
        { name: 'Tunísia', short_name: 'TUN', code: 'TUN' },
      ],
    },
    {
      letter: 'G',
      name: 'Grupo G',
      teams: [
        { name: 'Bélgica', short_name: 'BEL', code: 'BEL' },
        { name: 'Egito', short_name: 'EGY', code: 'EGY' },
        { name: 'Irã', short_name: 'IRN', code: 'IRN' },
        { name: 'Nova Zelândia', short_name: 'NZL', code: 'NZL' },
      ],
    },
    {
      letter: 'H',
      name: 'Grupo H',
      teams: [
        { name: 'Espanha', short_name: 'ESP', code: 'ESP' },
        { name: 'Cabo Verde', short_name: 'CPV', code: 'CPV' },
        { name: 'Arábia Saudita', short_name: 'KSA', code: 'KSA' },
        { name: 'Uruguai', short_name: 'URU', code: 'URU' },
      ],
    },
    {
      letter: 'I',
      name: 'Grupo I',
      teams: [
        { name: 'França', short_name: 'FRA', code: 'FRA' },
        { name: 'Senegal', short_name: 'SEN', code: 'SEN' },
        { name: 'Iraque', short_name: 'IRQ', code: 'IRQ' },
        { name: 'Noruega', short_name: 'NOR', code: 'NOR' },
      ],
    },
    {
      letter: 'J',
      name: 'Grupo J',
      teams: [
        { name: 'Argentina', short_name: 'ARG', code: 'ARG' },
        { name: 'Argélia', short_name: 'ALG', code: 'ALG' },
        { name: 'Áustria', short_name: 'AUT', code: 'AUT' },
        { name: 'Jordânia', short_name: 'JOR', code: 'JOR' },
      ],
    },
    {
      letter: 'K',
      name: 'Grupo K',
      teams: [
        { name: 'Portugal', short_name: 'POR', code: 'POR' },
        { name: 'República Democrática do Congo', short_name: 'COD', code: 'COD' },
        { name: 'Uzbequistão', short_name: 'UZB', code: 'UZB' },
        { name: 'Colômbia', short_name: 'COL', code: 'COL' },
      ],
    },
    {
      letter: 'L',
      name: 'Grupo L',
      teams: [
        { name: 'Inglaterra', short_name: 'ENG', code: 'ENG' },
        { name: 'Croácia', short_name: 'CRO', code: 'CRO' },
        { name: 'Gana', short_name: 'GHA', code: 'GHA' },
        { name: 'Panamá', short_name: 'PAN', code: 'PAN' },
      ],
    },
  ];

  for (const groupData of groupsData) {
    const existingGroup = await prisma.group.findUnique({
      where: { letter: groupData.letter },
    });

    if (!existingGroup) {
      const createdGroup = await prisma.group.create({
        data: {
          name: groupData.name,
          letter: groupData.letter,
        },
      });

      for (const team of groupData.teams) {
        await prisma.team.upsert({
          where: { code: team.code },
          update: {},
          create: {
            name: team.name,
            short_name: team.short_name,
            code: team.code,
            group_id: createdGroup.id,
          },
        });
      }
      console.log(`Grupo ${groupData.letter} e seleções criados.`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
