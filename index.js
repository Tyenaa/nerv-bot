// -----------------------------
// NERV BOT - COMPLETO
// -----------------------------
const { Client, GatewayIntentBits, Partials, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { token } = require('./config.json');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel]
});

// -----------------------------
// CONFIG
// -----------------------------
const TIER_CHANNEL_CATEGORY = '1490462544798810173'; // Categoría de Tickets
const MOD_CHANNEL = '1490581213159620659'; // Canal donde se registran warns, mutes, bans

const STAFF_ROLES = {
  helper: '1490466913237602324',
  mod: '1490466028545769473',
  admin: '1490466026356342804',
  owner: '1490466019720822884'
};

const TIERS = [
  { id: 1, name: 'Profesionales', emoji: '🏆', range: 'RLCS Player, Top 2 SSL', color: '#FFD700' },
  { id: 2, name: 'Competitivos', emoji: '⚡', range: 'Grand Champion 3', color: '#FF8C00' },
  { id: 3, name: 'Veteranos', emoji: '🎯', range: 'Grand Champion 2 a Champion 3', color: '#FF4500' },
  { id: 4, name: 'Aspirantes', emoji: '📈', range: 'Champion 2 a Diamond 3', color: '#1E90FF' },
  { id: 5, name: 'En Progreso', emoji: '🔰', range: 'Diamond 2 para abajo', color: '#32CD32' }
];

// -----------------------------
// BIENVENIDA
// -----------------------------
client.on('guildMemberAdd', member => {
  const channel = member.guild.systemChannel;
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setTitle(`Bienvenido a ${member.guild.name}!`)
    .setDescription(`Hola ${member}, presiona los botones para postularte a un Tier o abrir un Tryout.`)
    .setColor('#00BFFF');

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder().setCustomId('tier_1').setLabel('Tier 1 🏆').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('tier_2').setLabel('Tier 2 ⚡').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('tier_3').setLabel('Tier 3 🎯').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('tier_4').setLabel('Tier 4 📈').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('tier_5').setLabel('Tier 5 🔰').setStyle(ButtonStyle.Primary)
    );

  channel.send({ embeds: [embed], components: [row] });
});

// -----------------------------
// INTERACCIONES BOTONES - Tiers & Tryouts
// -----------------------------
client.on('interactionCreate', async interaction => {
  if (interaction.isButton()) {
    await interaction.deferReply({ ephemeral: true });

    // --------- TIERS ---------
    if (interaction.customId.startsWith('tier_')) {
      const tierClicked = TIERS.find(t => interaction.customId === `tier_${t.id}`);
      if (!tierClicked) return interaction.editReply({ content: '❌ Error: Tier no encontrado.' });

      const channelName = `tier-${interaction.user.username}`;
      const category = interaction.guild.channels.cache.get(TIER_CHANNEL_CATEGORY);

      const ticket = await interaction.guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: category.id,
        permissionOverwrites: [
          { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel] },
          { id: STAFF_ROLES.owner, allow: [PermissionsBitField.Flags.ViewChannel] },
          { id: STAFF_ROLES.admin, allow: [PermissionsBitField.Flags.ViewChannel] },
          { id: STAFF_ROLES.mod, allow: [PermissionsBitField.Flags.ViewChannel] },
          { id: interaction.guild.members.me.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageChannels] }
        ]
      });

      const embedTicket = new EmbedBuilder()
        .setTitle(`Postulación para Tiers`)
        .setDescription(`Estás por postularte al **${tierClicked.name}** (${tierClicked.range})\nIndica tu rango actual y envía tu ID de juego para verificación.`)
        .setColor(tierClicked.color);

      const rowClose = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('cerrar_ticket').setLabel('❌ Cerrar Ticket').setStyle(ButtonStyle.Danger)
      );

      await ticket.send({ embeds: [embedTicket], components: [rowClose] });
      return interaction.editReply({ content: `✅ Ticket creado: ${ticket}` });
    }

    // --------- TRYOUTS ---------
    if (interaction.customId.startsWith('tryout_')) {
      const tryoutName = interaction.customId.replace('tryout_', '');
      const channelName = `tryout-${interaction.user.username}`;
      const category = interaction.guild.channels.cache.get(TIER_CHANNEL_CATEGORY);

      const ticket = await interaction.guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: category.id,
        permissionOverwrites: [
          { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel] },
          { id: STAFF_ROLES.owner, allow: [PermissionsBitField.Flags.ViewChannel] },
          { id: STAFF_ROLES.admin, allow: [PermissionsBitField.Flags.ViewChannel] },
          { id: STAFF_ROLES.mod, allow: [PermissionsBitField.Flags.ViewChannel] },
          { id: interaction.guild.members.me.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageChannels] }
        ]
      });

      const embedTicket = new EmbedBuilder()
        .setTitle(`Tryout: ${tryoutName}`)
        .setDescription(`Has abierto un canal para tu **tryout**: ${tryoutName}. El staff revisará pronto.`)
        .setColor('#00BFFF');

      const rowClose = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('cerrar_ticket').setLabel('❌ Cerrar Ticket').setStyle(ButtonStyle.Danger)
      );

      await ticket.send({ embeds: [embedTicket], components: [rowClose] });
      return interaction.editReply({ content: `✅ Ticket de tryout creado: ${ticket}` });
    }

    // --------- CERRAR TICKET ---------
    if (interaction.customId === 'cerrar_ticket') {
      await interaction.reply({ content: '🧹 Cerrando ticket...', ephemeral: true });
      return setTimeout(() => interaction.channel.delete().catch(console.error), 2000);
    }

    return interaction.editReply({ content: '❌ Botón desconocido.' });
  }
});

// -----------------------------
// MODERACIÓN - WARN, MUTE, BAN
// -----------------------------
const MODERATION = {}; // guardamos historial {userId: {warns:0, mutes:0, bans:0}}

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, options } = interaction;

  const member = options.getMember('usuario');
  const reason = options.getString('razon') || 'No especificada';

  if (commandName === 'warn') {
    if (![STAFF_ROLES.helper, STAFF_ROLES.mod, STAFF_ROLES.admin, STAFF_ROLES.owner].includes(interaction.member.roles.highest.id)) 
      return interaction.reply({ content: '❌ No tienes permisos.', ephemeral: true });

    MODERATION[member.id] = MODERATION[member.id] || { warns: 0, mutes: 0, bans: 0 };
    MODERATION[member.id].warns++;

    const embed = new EmbedBuilder()
      .setTitle('⚠️ Usuario Advertido')
      .setDescription(`${member} ha recibido un warn.\nMotivo: ${reason}\nTotal Warns: ${MODERATION[member.id].warns}`)
      .setColor('#FFA500');

    client.channels.cache.get(MOD_CHANNEL).send({ embeds: [embed] });
    return interaction.reply({ content: `✅ ${member} advertido.`, ephemeral: true });
  }

  // TODO: Añadir mute y ban similar con permisos según roles
});

// -----------------------------
// LOGIN
// -----------------------------
client.once('clientReady', () => {
  console.log('🚀 NERV Bot listo');
});

client.login(token);