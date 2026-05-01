const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField,
  EmbedBuilder
} = require('discord.js');

// ==========================
// TOKEN (Railway)
// ==========================
const TOKEN = process.env.DISCORD_TOKEN;

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
  MOD: '1490466028545769473'
};

// ==========================
// IMÁGENES
// ==========================
const WELCOME_BANNER =
'https://media.discordapp.net/attachments/1490445497318641670/1490484413081845830/Gemini_Generated_Image_sqh3sisqh3sisqh3_1.png';

const PANEL_BANNER =
'https://media.discordapp.net/attachments/1490445497318641670/1490460787318325482/Gemini_Generated_Image_vqali7vqali7vqal.png';

const LOGO =
'https://media.discordapp.net/attachments/1490445497318641670/1490476067981496481/nerv_logo.png';

// ==========================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

console.log('🚀 Iniciando NERV Bot...');

// ==========================
// IDIOMAS
// ==========================
const LANGS = [
  {
    code: 'es',
    emoji: '🇪🇸',
    name: 'Español',
    ticket: 'espanol',
    footer: '⚡ NERV - Compite, mejora y disfruta!',

    rulesTitle: '📜 Reglas - NERV',
    rules: [
      'Respeta a todos los miembros.',
      'No spam o flood.',
      'No NSFW.',
      'No toxicidad extrema.',
      'Usa canales correctamente.',
      'No compartas información privada.',
      'Sigue instrucciones del staff.',
      'No cheats.'
    ],

    tryoutTitle: '🎟️ Tryouts - NERV',
    tryoutDesc: 'Presiona el botón para abrir tu tryout.',
    tryoutBtn: 'Abrir Tryout',

    tierTitle: '🎮 Tiers - NERV',
    tierDesc: 'Presiona el botón para abrir tu ticket.',
    tierBtn: 'Abrir Tier'
  },

  {
    code: 'en',
    emoji: '🇬🇧',
    name: 'English',
    ticket: 'english',
    footer: '⚡ NERV - Compete, improve and enjoy!',

    rulesTitle: '📜 Rules - NERV',
    rules: [
      'Respect all members.',
      'No spam or flood.',
      'No NSFW.',
      'No extreme toxicity.',
      'Use channels correctly.',
      'Do not share private information.',
      'Follow staff instructions.',
      'No cheats.'
    ],

    tryoutTitle: '🎟️ Tryouts - NERV',
    tryoutDesc: 'Press the button to open your tryout.',
    tryoutBtn: 'Open Tryout',

    tierTitle: '🎮 Tiers - NERV',
    tierDesc: 'Press the button to open your ticket.',
    tierBtn: 'Open Tier'
  },

  {
    code: 'pt',
    emoji: '🇵🇹',
    name: 'Português',
    ticket: 'portuguese',
    footer: '⚡ NERV - Compita, melhore e aproveite!',

    rulesTitle: '📜 Regras - NERV',
    rules: [
      'Respeite todos.',
      'Sem spam.',
      'Sem NSFW.',
      'Sem toxicidade extrema.',
      'Use canais corretamente.',
      'Não compartilhe dados privados.',
      'Siga a staff.',
      'Sem cheats.'
    ],

    tryoutTitle: '🎟️ Tryouts - NERV',
    tryoutDesc: 'Clique para abrir seu tryout.',
    tryoutBtn: 'Abrir Tryout',

    tierTitle: '🎮 Tiers - NERV',
    tierDesc: 'Clique para abrir seu ticket.',
    tierBtn: 'Abrir Tier'
  },

  {
    code: 'fr',
    emoji: '🇫🇷',
    name: 'Français',
    ticket: 'francais',
    footer: '⚡ NERV - Compétez, améliorez et profitez!',

    rulesTitle: '📜 Règles - NERV',
    rules: [
      'Respectez tout le monde.',
      'Pas de spam.',
      'Pas de NSFW.',
      'Pas de toxicité extrême.',
      'Utilisez les salons correctement.',
      'Ne partagez pas les données privées.',
      'Suivez le staff.',
      'Pas de cheats.'
    ],

    tryoutTitle: '🎟️ Tryouts - NERV',
    tryoutDesc: 'Appuyez pour ouvrir votre tryout.',
    tryoutBtn: 'Ouvrir Tryout',

    tierTitle: '🎮 Tiers - NERV',
    tierDesc: 'Appuyez pour ouvrir votre ticket.',
    tierBtn: 'Ouvrir Tier'
  }
];

// ==========================
async function clearChannel(channel) {
  const msgs = await channel.messages.fetch({ limit: 100 });
  if (msgs.size > 0) {
    await channel.bulkDelete(msgs, true).catch(() => {});
  }
}

// ==========================
// BIENVENIDA + AUTOROL
// ==========================
client.on('guildMemberAdd', async member => {
  try {
    const role = member.guild.roles.cache.get(IDS.MEMBER_ROLE);
    if (role) await member.roles.add(role);

    const channel = member.guild.channels.cache.get(IDS.WELCOME_CHANNEL);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setTitle('🎉 Welcome to NERV! ⚡')
      .setDescription(
`🇪🇸 Bienvenido ${member}
🇬🇧 Welcome ${member}
🇵🇹 Bem-vindo ${member}
🇫🇷 Bienvenue ${member}`
      )
      .setImage(WELCOME_BANNER)
      .setThumbnail(LOGO)
      .setColor('#8A2BE2')
      .setFooter({ text: '⚡ NERV Community' });

    await channel.send({ embeds: [embed] });

  } catch (e) {
    console.error(e);
  }
});

// ==========================
client.once('ready', async () => {
  console.log(`🔥 Bot listo como ${client.user.tag}`);

  const rules = await client.channels.fetch(IDS.RULES_CHANNEL);
  const tryouts = await client.channels.fetch(IDS.TRYOUTS_CHANNEL);
  const tiers = await client.channels.fetch(IDS.TIERS_CHANNEL);

  await clearChannel(rules);
  await clearChannel(tryouts);
  await clearChannel(tiers);

  // REGLAS
  for (const lang of LANGS) {
    const embed = new EmbedBuilder()
      .setTitle(`${lang.emoji} ${lang.rulesTitle}`)
      .setDescription(
`╔════════════════╗
      **NERV RULEBOOK**
╚════════════════╝

📌 **General**
1️⃣ ${lang.rules[0]}
2️⃣ ${lang.rules[1]}
3️⃣ ${lang.rules[2]}
4️⃣ ${lang.rules[3]}

🎮 **Community**
5️⃣ ${lang.rules[4]}
6️⃣ ${lang.rules[5]}

🛡️ **Staff**
7️⃣ ${lang.rules[6]}
8️⃣ ${lang.rules[7]}

⚠️ Breaking rules may result in punishment.`
      )
      .setImage(PANEL_BANNER)
      .setThumbnail(LOGO)
      .setColor('#E10600')
      .setFooter({ text: lang.footer });

    await rules.send({ embeds: [embed] });
  }

  // TRYOUTS
  for (const lang of LANGS) {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`tryout_${lang.code}`)
        .setLabel(`${lang.tryoutBtn} ${lang.emoji}`)
        .setStyle(ButtonStyle.Danger)
    );

    const embed = new EmbedBuilder()
      .setTitle(`${lang.emoji} ${lang.tryoutTitle}`)
      .setDescription(lang.tryoutDesc)
      .setImage(PANEL_BANNER)
      .setThumbnail(LOGO)
      .setColor('#00FFFF')
      .setFooter({ text: lang.footer });

    await tryouts.send({ embeds:[embed], components:[row] });
  }

  // TIERS
  for (const lang of LANGS) {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`tier_${lang.code}`)
        .setLabel(`${lang.tierBtn} ${lang.emoji}`)
        .setStyle(ButtonStyle.Primary)
    );

    const embed = new EmbedBuilder()
      .setTitle(`${lang.emoji} ${lang.tierTitle}`)
      .setDescription(lang.tierDesc)
      .setImage(PANEL_BANNER)
      .setThumbnail(LOGO)
      .setColor('#E10600')
      .setFooter({ text: lang.footer });

    await tiers.send({ embeds:[embed], components:[row] });
  }
});

// ==========================
client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'close_ticket') {
    await interaction.reply({ content:'🧹 Cerrando...', ephemeral:true });
    setTimeout(() => interaction.channel.delete(), 2000);
    return;
  }

  const isTryout = interaction.customId.startsWith('tryout_');
  const isTier = interaction.customId.startsWith('tier_');
  if (!isTryout && !isTier) return;

  const code = interaction.customId.split('_')[1];
  const lang = LANGS.find(x => x.code === code);
  if (!lang) return;

  const username = interaction.user.username
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  const name = `${lang.ticket}-${isTryout ? 'tryout':'tier'}-${username}`;

  const exists = interaction.guild.channels.cache.find(c => c.name === name);
  if (exists) {
    return interaction.reply({
      content:'❌ Ya tienes un ticket.',
      ephemeral:true
    });
  }

  const ticket = await interaction.guild.channels.create({
    name,
    type: ChannelType.GuildText,
    parent: IDS.TICKET_CATEGORY,
    permissionOverwrites: [
      { id: interaction.guild.id, deny:[PermissionsBitField.Flags.ViewChannel] },
      { id: interaction.user.id, allow:[PermissionsBitField.Flags.ViewChannel] },
      { id: IDS.OWNER, allow:[PermissionsBitField.Flags.ViewChannel] },
      { id: IDS.ADMIN, allow:[PermissionsBitField.Flags.ViewChannel] },
      { id: IDS.MOD, allow:[PermissionsBitField.Flags.ViewChannel] }
    ]
  });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('close_ticket')
      .setLabel('❌ Cerrar Ticket')
      .setStyle(ButtonStyle.Danger)
  );

  const embed = new EmbedBuilder()
    .setTitle(isTryout ? lang.tryoutTitle : lang.tierTitle)
    .setDescription('Envía aquí tu información.')
    .setImage(PANEL_BANNER)
    .setThumbnail(LOGO)
    .setColor('#00FFFF')
    .setFooter({ text: lang.footer });

  await ticket.send({ embeds:[embed], components:[row] });

  await interaction.reply({
    content:`✅ Ticket creado: ${ticket}`,
    ephemeral:true
  });
});

client.login(TOKEN);