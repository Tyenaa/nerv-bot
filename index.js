require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

const TOKEN = process.env.DISCORD_TOKEN;

const IDS = {
  reglas: '1490450067860230235',
  tryouts: '1490462939361312941',
  tiers: '1490565371294650488',
  bienvenida: '1490483811664924883',
  categoria: '1490462544798810173',
  miembro: '1490466327045869628',
  botRole: '1490472100304257175',
  owner: '1490466019720822884',
  admin: '1490466026356342804',
  mod: '1490466028545769473'
};

const PANEL = 'https://media.discordapp.net/attachments/1490445497318641670/1490460787318325482/Gemini_Generated_Image_vqali7vqali7vqal.png';
const WELCOME = 'https://media.discordapp.net/attachments/1490445497318641670/1490484413081845830/Gemini_Generated_Image_sqh3sisqh3sisqh3_1.png';
const LOGO = 'https://media.discordapp.net/attachments/1490445497318641670/1490476067981496481/nerv_logo.png';

const LANGS = [
  {
    code:'es', name:'Español', emoji:'🇪🇸',
    rulesTitle:'📜 NERV — REGLAS OFICIALES',
    tryoutTitle:'🎟️ NERV TRYOUTS',
    tryoutText:`⚡ Aplica al equipo NERV

Presiona el botón para iniciar tu proceso.
Solo jugadores serios.`,
    tierTitle:'🎮 TIERS - NERV',
    tierDesc:'Selecciona tu tier y abre ticket',
    tierNames:['🏆 Profesionales','⚡ Competitivos','🎯 Veteranos','📈 Aspirantes','🔰 En progreso'],
    tryoutFooter:'⚡ NERV — No solo jugamos, dominamos.',
    buttonTryout:'Abrir Tryout'
  },
  {
    code:'en', name:'English', emoji:'🇺🇸',
    rulesTitle:'📜 NERV — OFFICIAL RULES',
    tryoutTitle:'🎟️ NERV TRYOUTS',
    tryoutText:`⚡ Apply for Team NERV

Press the button to start your process.
Serious players only.`,
    tierTitle:'🎮 TIERS - NERV',
    tierDesc:'Choose your tier and open ticket',
    tierNames:['🏆 Professionals','⚡ Competitive','🎯 Veterans','📈 Aspirants','🔰 In Progress'],
    tryoutFooter:'⚡ NERV — We don’t just play, we dominate.',
    buttonTryout:'Open Tryout'
  },
  {
    code:'pt', name:'Português', emoji:'🇧🇷',
    rulesTitle:'📜 NERV — REGRAS OFICIAIS',
    tryoutTitle:'🎟️ NERV TRYOUTS',
    tryoutText:`⚡ Candidate-se para a equipe NERV

Pressione o botão para iniciar seu processo.
Apenas jogadores sérios.`,
    tierTitle:'🎮 TIERS - NERV',
    tierDesc:'Selecione seu tier e abra ticket',
    tierNames:['🏆 Profissionais','⚡ Competitivos','🎯 Veteranos','📈 Aspirantes','🔰 Em progresso'],
    tryoutFooter:'⚡ NERV — Não apenas jogamos, dominamos.',
    buttonTryout:'Abrir Tryout'
  },
  {
    code:'fr', name:'Français', emoji:'🇫🇷',
    rulesTitle:'📜 NERV — RÈGLES OFFICIELLES',
    tryoutTitle:'🎟️ NERV TRYOUTS',
    tryoutText:`⚡ Postule pour l\'équipe NERV

Appuie sur le bouton pour commencer ton processus.
Joueurs sérieux uniquement.`,
    tierTitle:'🎮 TIERS - NERV',
    tierDesc:'Choisis ton tier et ouvre ticket',
    tierNames:['🏆 Professionnels','⚡ Compétitifs','🎯 Vétérans','📈 Aspirants','🔰 En progression'],
    tryoutFooter:'⚡ NERV — Nous ne jouons pas seulement, nous dominons.',
    buttonTryout:'Ouvrir Tryout'
  }
];

const STAFF_PERMS = [
  { id: IDS.owner, allow: [PermissionsBitField.Flags.ViewChannel] },
  { id: IDS.admin, allow: [PermissionsBitField.Flags.ViewChannel] },
  { id: IDS.mod, allow: [PermissionsBitField.Flags.ViewChannel] },
  {
    id: IDS.botRole,
    allow: [
      PermissionsBitField.Flags.ViewChannel,
      PermissionsBitField.Flags.SendMessages,
      PermissionsBitField.Flags.ManageChannels
    ]
  }
];

async function hasOpenTicket(guild, userId, prefix) {
  return guild.channels.cache.find(c =>
    c.parentId === IDS.categoria &&
    c.name.includes(userId) &&
    c.name.startsWith(prefix)
  );
}

async function createTicket(interaction, type, data) {
  const exists = await hasOpenTicket(interaction.guild, interaction.user.id, type);
  if (exists) {
    return interaction.reply({
      content: `❌ Ya tienes un ticket abierto: ${exists}`,
      ephemeral: true
    });
  }

  const channel = await interaction.guild.channels.create({
    name: `${type}-${interaction.user.id}`,
    type: ChannelType.GuildText,
    parent: IDS.categoria,
    permissionOverwrites: [
      { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
      { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel] },
      ...STAFF_PERMS
    ]
  });

  const embed = new EmbedBuilder()
    .setTitle('📩 Nueva Aplicación')
    .setColor('#00FFFF')
    .setThumbnail(LOGO);

  for (const [k,v] of Object.entries(data)) {
    embed.addFields({ name: k, value: v || 'No respondido' });
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('cerrar_ticket').setLabel('❌ Cerrar Ticket').setStyle(ButtonStyle.Danger)
  );

  await channel.send({ embeds:[embed], components:[row] });
  await interaction.reply({ content:`✅ Ticket creado: ${channel}`, ephemeral:true });
}

// ================= READY =================
client.once('ready', async () => {
  console.log(`🔥 ${client.user.tag}`);

  const reglas = await client.channels.fetch(IDS.reglas).catch(()=>null);
  const tryouts = await client.channels.fetch(IDS.tryouts).catch(()=>null);
  const tiers = await client.channels.fetch(IDS.tiers).catch(()=>null);

  if (reglas) {
    for (const lang of LANGS) {
      const embed = new EmbedBuilder()
        .setTitle(`${lang.emoji} ${lang.rulesTitle}`)
        .setDescription('Respeta a todos
No spam
No NSFW')
        .setColor('#E10600')
        .setImage(PANEL)
        .setThumbnail(LOGO);
      await reglas.send({embeds:[embed]});
    }
  }

  if (tryouts) {
    for (const lang of LANGS) {
      const embed = new EmbedBuilder()
        .setTitle(`${lang.emoji} ${lang.tryoutTitle}`)
        .setDescription(lang.tryoutText)
        .setFooter({text: lang.tryoutFooter})
        .setColor('#E10600')
        .setImage(PANEL)
        .setThumbnail(LOGO);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`tryout_${lang.code}`)
          .setLabel(lang.buttonTryout)
          .setStyle(ButtonStyle.Danger)
      );

      await tryouts.send({embeds:[embed], components:[row]});
    }
  }

  if (tiers) {
    for (const lang of LANGS) {
      const embed = new EmbedBuilder()
        .setTitle(`${lang.emoji} ${lang.tierTitle}`)
        .setDescription(lang.tierDesc)
        .addFields(
          {name: lang.tierNames[0], value:'RLCS'},
          {name: lang.tierNames[1], value:'SSL → GC3'},
          {name: lang.tierNames[2], value:'GC2 → C3'},
          {name: lang.tierNames[3], value:'C2 → D3'},
          {name: lang.tierNames[4], value:'D2 ↓'}
        )
        .setColor('#E10600')
        .setImage(PANEL)
        .setThumbnail(LOGO);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`tier1_${lang.code}`).setLabel(lang.tierNames[0]).setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId(`tier2_${lang.code}`).setLabel(lang.tierNames[1]).setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId(`tier3_${lang.code}`).setLabel(lang.tierNames[2]).setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId(`tier4_${lang.code}`).setLabel(lang.tierNames[3]).setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId(`tier5_${lang.code}`).setLabel(lang.tierNames[4]).setStyle(ButtonStyle.Danger)
      );

      await tiers.send({embeds:[embed], components:[row]});
    }
  }
});

// ================= INTERACCIONES =================
client.on('interactionCreate', async interaction => {
  if (interaction.isButton()) {

    if (interaction.customId.startsWith('tryout_')) {
      const modal = new ModalBuilder().setCustomId('tryout_modal').setTitle('Tryout');
      modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('ID').setLabel('ID Juego').setStyle(TextInputStyle.Short)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('Rango').setLabel('Rango').setStyle(TextInputStyle.Short)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('Horas').setLabel('Horas').setStyle(TextInputStyle.Short)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('Motivo').setLabel('Motivo').setStyle(TextInputStyle.Paragraph))
      );
      return interaction.showModal(modal);
    }

    if (interaction.customId.startsWith('tier')) {
      const modal = new ModalBuilder().setCustomId('tier_modal').setTitle('Tier');
      modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('Rango').setLabel('Rango (Rocket Tracker)').setStyle(TextInputStyle.Short)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('ID').setLabel('ID Juego').setStyle(TextInputStyle.Short))
      );
      return interaction.showModal(modal);
    }

    if (interaction.customId === 'cerrar_ticket') {
      await interaction.reply({ content: '🧹 Cerrando...', ephemeral: true });
      setTimeout(() => interaction.channel.delete().catch(() => {}), 2000);
    }
  }

  if (interaction.isModalSubmit()) {
    const data = {};
    interaction.fields.fields.forEach(f => data[f.customId] = f.value);

    if (interaction.customId === 'tryout_modal') {
      return createTicket(interaction, 'tryout', data);
    }

    if (interaction.customId === 'tier_modal') {
      return createTicket(interaction, 'tier', data);
    }
  }
});

client.login(TOKEN);
