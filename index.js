const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType,
  PermissionsBitField,
  EmbedBuilder
} = require('discord.js');

// ==========================
// IDs
// ==========================
const IDS = {
  MEMBER_ROLE: '1490466327045869628',
  WELCOME_CHANNEL: '1490483811664924883',
  RULES_CHANNEL: '1490450067860230235',
  TRYOUTS_CHANNEL: '1490462939361312941',
  TIERS_CHANNEL: '1490565371294650488',
  TICKET_CATEGORY: '1490462544798810173',

  OWNER: '1490466019720822884',
  ADMIN: '1490466026356342804',
  MOD: '1490466028545769473',
  BOT_ROLE: '1490472100304257175'
};

// ==========================
// CLIENT
// ==========================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

console.log('🚀 Iniciando NERV Bot...');

// ==========================
// TEXTOS
// ==========================
const languages = [
  {
    code: 'es',
    name: 'Español',
    ticket: 'español',
    emoji: '🇪🇸',
    tryoutButton: 'Abrir Tryout',
    tierButton: 'Abrir Tiers',
    rulesTitle: '📜 REGLAS NERV',
    rules: [
      'Respeta a todos los miembros',
      'No spam',
      'No NSFW',
      'No toxicidad extrema',
      'Usa los canales correctamente',
      'No compartas información privada',
      'Sigue al staff',
      'No cheats'
    ]
  },
  {
    code: 'en',
    name: 'English',
    ticket: 'english',
    emoji: '🇬🇧',
    tryoutButton: 'Open Tryout',
    tierButton: 'Open Tiers',
    rulesTitle: '📜 NERV RULES',
    rules: [
      'Respect all members',
      'No spam',
      'No NSFW',
      'No extreme toxicity',
      'Use channels correctly',
      'Do not share private info',
      'Follow staff',
      'No cheats'
    ]
  },
  {
    code: 'pt',
    name: 'Português',
    ticket: 'portuguese',
    emoji: '🇵🇹',
    tryoutButton: 'Abrir Tryout',
    tierButton: 'Abrir Tiers',
    rulesTitle: '📜 REGRAS NERV',
    rules: [
      'Respeite todos',
      'Sem spam',
      'Sem NSFW',
      'Sem toxicidade',
      'Use canais corretamente',
      'Não compartilhe dados privados',
      'Siga a staff',
      'Sem cheats'
    ]
  },
  {
    code: 'fr',
    name: 'Français',
    ticket: 'francais',
    emoji: '🇫🇷',
    tryoutButton: 'Ouvrir Tryout',
    tierButton: 'Ouvrir Tiers',
    rulesTitle: '📜 RÈGLES NERV',
    rules: [
      'Respectez tout le monde',
      'Pas de spam',
      'Pas de NSFW',
      'Pas de toxicité',
      'Utilisez les salons',
      'Ne partagez pas d’infos privées',
      'Suivez le staff',
      'Pas de cheats'
    ]
  }
];

// ==========================
// AUTOROL + BIENVENIDA
// ==========================
client.on('guildMemberAdd', async member => {
  try {
    const role = member.guild.roles.cache.get(IDS.MEMBER_ROLE);
    if (role) await member.roles.add(role);

    const channel = member.guild.channels.cache.get(IDS.WELCOME_CHANNEL);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setTitle('🎉 Welcome to NERV / Bienvenido / Bem-vindo / Bienvenue ⚡')
      .setDescription(`
🇪🇸 Bienvenido a NERV, ${member}  
🇬🇧 Welcome to NERV, ${member}  
🇵🇹 Bem-vindo à NERV, ${member}  
🇫🇷 Bienvenue à NERV, ${member}
      `)
      .setImage('https://media.discordapp.net/attachments/1490445497318641670/1490484413081845830/Gemini_Generated_Image_sqh3sisqh3sisqh3_1.png')
      .setThumbnail('https://media.discordapp.net/attachments/1490445497318641670/1490476067981496481/nerv_logo.png')
      .setColor('#8A2BE2');

    await channel.send({ embeds: [embed] });

  } catch (e) {
    console.error(e);
  }
});

// ==========================
// LIMPIAR CANAL
// ==========================
async function clearChannel(channel) {
  const msgs = await channel.messages.fetch({ limit: 100 });
  if (msgs.size) await channel.bulkDelete(msgs, true);
}

// ==========================
// READY
// ==========================
client.once('ready', async () => {
  console.log(`🔥 ${client.user.tag}`);

  const rules = await client.channels.fetch(IDS.RULES_CHANNEL);
  const tryouts = await client.channels.fetch(IDS.TRYOUTS_CHANNEL);
  const tiers = await client.channels.fetch(IDS.TIERS_CHANNEL);

  await clearChannel(rules);
  await clearChannel(tryouts);
  await clearChannel(tiers);

  // REGLAS
  for (const lang of languages) {
    const embed = new EmbedBuilder()
      .setTitle(`${lang.emoji} ${lang.rulesTitle}`)
      .setDescription(
        lang.rules.map((r, i) => `${i + 1}. ${r}`).join('\n')
      )
      .setColor('#ff0000');

    await rules.send({ embeds: [embed] });
  }

  // TRYOUTS
  for (const lang of languages) {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`tryout_${lang.code}`)
        .setLabel(`${lang.tryoutButton} ${lang.emoji}`)
        .setStyle(ButtonStyle.Danger)
    );

    await tryouts.send({
      embeds: [
        new EmbedBuilder()
          .setTitle(`${lang.emoji} ${lang.name} Tryout`)
          .setDescription('Press the button / Presiona / Clique / Appuyez')
          .setColor('#00ffff')
      ],
      components: [row]
    });
  }

  // TIERS
  for (const lang of languages) {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`tiers_${lang.code}`)
        .setLabel(`${lang.tierButton} ${lang.emoji}`)
        .setStyle(ButtonStyle.Primary)
    );

    await tiers.send({
      embeds: [
        new EmbedBuilder()
          .setTitle(`${lang.emoji} ${lang.name} Tiers`)
          .setDescription('Choose your tier')
          .setColor('#ffaa00')
      ],
      components: [row]
    });
  }
});

// ==========================
// TICKETS
// ==========================
client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  const isTryout = interaction.customId.startsWith('tryout_');
  const isTier = interaction.customId.startsWith('tiers_');

  if (!isTryout && !isTier) return;

  const code = interaction.customId.split('_')[1];
  const lang = languages.find(l => l.code === code);

  const exists = interaction.guild.channels.cache.find(
    c => c.name.includes(interaction.user.username.toLowerCase())
  );

  if (exists) {
    return interaction.reply({
      content: 'Ya tienes ticket abierto.',
      ephemeral: true
    });
  }

  const overwrites = [
    {
      id: interaction.guild.id,
      deny: [PermissionsBitField.Flags.ViewChannel]
    },
    {
      id: interaction.user.id,
      allow: [PermissionsBitField.Flags.ViewChannel]
    },
    {
      id: IDS.OWNER,
      allow: [PermissionsBitField.Flags.ViewChannel]
    },
    {
      id: IDS.ADMIN,
      allow: [PermissionsBitField.Flags.ViewChannel]
    },
    {
      id: IDS.MOD,
      allow: [PermissionsBitField.Flags.ViewChannel]
    }
  ];

  const type = isTryout ? 'tryout' : 'tier';

  const ticket = await interaction.guild.channels.create({
    name: `${lang.ticket}-${type}-${interaction.user.username}`,
    type: ChannelType.GuildText,
    parent: IDS.TICKET_CATEGORY,
    permissionOverwrites: overwrites
  });

  const close = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('close_ticket')
      .setLabel('❌ Cerrar')
      .setStyle(ButtonStyle.Danger)
  );

  await ticket.send({
    embeds: [
      new EmbedBuilder()
        .setTitle(`${lang.emoji} ${lang.name}`)
        .setDescription(
          isTryout
            ? 'Envía aquí tu información de tryout.'
            : 'Envía aquí tu información de tiers.'
        )
        .setColor('#00ffff')
    ],
    components: [close]
  });

  await interaction.reply({
    content: `✅ ${ticket}`,
    ephemeral: true
  });
});

// ==========================
// CERRAR
// ==========================
client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;
  if (interaction.customId !== 'close_ticket') return;

  await interaction.reply({ content: '🧹', ephemeral: true });

  setTimeout(() => {
    interaction.channel.delete().catch(console.error);
  }, 2000);
});

// ==========================
client.login(process.env.DISCORD_TOKEN);