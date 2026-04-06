// ---------------------------
// NERV BOT COMPLETO
// ---------------------------
const { 
  Client, 
  GatewayIntentBits, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ChannelType, 
  PermissionsBitField, 
  EmbedBuilder, 
  REST, 
  Routes, 
  SlashCommandBuilder 
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages
  ]
});

console.log("🚀 Iniciando NERV Bot...");

const SERVER_ID = '1490440780341448846';
const STAFF_LOG_CHANNEL = '1490581213159620659';

// --------------------------
// ROLES DEL STAFF Y PERMISOS
// --------------------------
const STAFF_ROLES = {
  owner: '1490466019720822884',
  admin: '1490466026356342804',
  mod: '1490466028545769473',
  helper: '1490466913237602324'
};

// --------------------------
// ROLES TIERS
// --------------------------
const TIERS = [
  { id: '1490563096610078862', name: 'Profesionales', range: 'Jugador RLCS', emoji: '🏆', color: '#FFD700' },
  { id: '1490563098937921748', name: 'Competitivos', range: 'SSL a Gran Champion 3', emoji: '⚡', color: '#1E90FF' },
  { id: '1490563101479931964', name: 'Veteranos', range: 'Gran Champion 2 a Champion 3', emoji: '🎯', color: '#FF4500' },
  { id: '1490563105736884325', name: 'Aspirantes', range: 'Champion 2 a Diamante 3', emoji: '📈', color: '#32CD32' },
  { id: '1490563136783126710', name: 'En Progreso', range: 'Diamante 2 para abajo', emoji: '🔰', color: '#808080' }
];

// --------------------------
// WELCOME + AUTO-ROL
// --------------------------
client.on('guildMemberAdd', async member => {
  try {
    const rolMiembro = member.guild.roles.cache.get('1490466327045869628'); 
    if (rolMiembro) await member.roles.add(rolMiembro);

    const canalBienvenida = member.guild.channels.cache.get('1490483811664924883');
    if (canalBienvenida) {
      const embed = new EmbedBuilder()
        .setTitle('🎉 ¡Bienvenido a NERV! ⚡')
        .setDescription(`¡Nos alegra tenerte en el servidor, ${member.user.username}! Aquí podrás mejorar, competir y formar parte de la comunidad NERV.`)
        .setThumbnail('https://media.discordapp.net/attachments/1490445497318641670/1490476067981496481/nerv_logo.png')
        .setColor('#8A2BE2')
        .setFooter({ text: '⚡ ¡Compite, mejora y disfruta! - NERV' });

      canalBienvenida.send({ embeds: [embed] });
    }

  } catch (error) {
    console.error("❌ Error en bienvenida:", error);
  }
});

// --------------------------
// BOTÓN TIERS / TICKETS
// --------------------------
client.once('ready', async () => {
  console.log(`🔥 Bot listo como ${client.user.tag}`);

  // Crear role Muted si no existe
  const guild = await client.guilds.fetch(SERVER_ID);
  let mutedRole = guild.roles.cache.find(r => r.name === 'Muted');
  if (!mutedRole) {
    mutedRole = await guild.roles.create({
      name: 'Muted',
      color: '#555555',
      permissions: []
    });

    // Aplicar overwrites a todos los canales
    guild.channels.cache.forEach(async ch => {
      await ch.permissionOverwrites.edit(mutedRole, {
        SendMessages: false,
        AddReactions: false,
        Speak: false
      });
    });
  }
});

// --------------------------
// INTERACTIONS (BOTONES + SLASH)
// --------------------------
client.on('interactionCreate', async interaction => {
  // --------------------------
  // BOTONES DE TIERS
  // --------------------------
  if (interaction.isButton()) {
    await interaction.deferReply({ ephemeral: true });

    const tierClicked = TIERS.find(t => interaction.customId === `tier_${t.id}`);
    if (!tierClicked) return;

    try {
      const channelName = `tier-${interaction.user.username}`;
      const category = interaction.guild.channels.cache.get('1490462544798810173'); // Categoría Tryouts

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
        .setDescription(`Estás por postularte al **${tierClicked.name}** (${tierClicked.range})\n\nPor favor indica tu rango actual y manda una prueba que verifique tu nivel de esta temporada junto con tu ID del juego.`)
        .setColor(tierClicked.color)
        .setFooter({ text: '⚡ NERV - Compite, mejora y disfruta!' });

      const rowClose = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('cerrar_ticket').setLabel('❌ Cerrar Ticket').setStyle(ButtonStyle.Danger)
      );

      await ticket.send({ embeds: [embedTicket], components: [rowClose] });
      await interaction.editReply({ content: `✅ Ticket creado: ${ticket}` });

    } catch (err) {
      console.error(err);
      await interaction.editReply({ content: '❌ Error creando ticket.' });
    }
  }

  // --------------------------
  // CERRAR TICKET
  // --------------------------
  if (interaction.isButton() && interaction.customId === 'cerrar_ticket') {
    await interaction.reply({ content: '🧹 Cerrando ticket...', ephemeral: true });
    setTimeout(() => interaction.channel.delete().catch(console.error), 2000);
  }

  // --------------------------
  // SLASH COMMANDS MODERACIÓN
  // --------------------------
  if (!interaction.isChatInputCommand()) return;

  const { commandName, options, member } = interaction;
  const logChannel = interaction.guild.channels.cache.get(STAFF_LOG_CHANNEL);

  // Verificar permisos según rol
  const userRoles = member.roles.cache;
  const canWarn = userRoles.has(STAFF_ROLES.owner) || userRoles.has(STAFF_ROLES.admin) || userRoles.has(STAFF_ROLES.mod) || userRoles.has(STAFF_ROLES.helper);
  const canMute = userRoles.has(STAFF_ROLES.owner) || userRoles.has(STAFF_ROLES.admin) || userRoles.has(STAFF_ROLES.mod) || userRoles.has(STAFF_ROLES.helper);
  const canBan = userRoles.has(STAFF_ROLES.owner) || userRoles.has(STAFF_ROLES.admin) || userRoles.has(STAFF_ROLES.mod);

  if (commandName === 'warn') {
    if (!canWarn) return interaction.reply({ content: '❌ No tienes permiso.', ephemeral: true });
    const user = options.getUser('usuario');
    const razon = options.getString('razon');
    const embed = new EmbedBuilder()
      .setTitle('⚠️ Usuario Wardeado')
      .setDescription(`${user.tag} ha recibido un **warn**\nRazón: ${razon}`)
      .setColor('#FFA500')
      .setTimestamp();
    logChannel.send({ embeds: [embed] });
    interaction.reply({ content: `✅ ${user.tag} advertido.` });
  }

  if (commandName === 'mute') {
    if (!canMute) return interaction.reply({ content: '❌ No tienes permiso.', ephemeral: true });
    const user = options.getMember('usuario');
    const tiempo = options.getInteger('tiempo'); // en minutos
    const razon = options.getString('razon');
    const mutedRole = interaction.guild.roles.cache.find(r => r.name === 'Muted');
    if (!mutedRole) return interaction.reply({ content: '❌ No se encontró rol Muted.' });

    await user.roles.add(mutedRole);
    interaction.reply({ content: `✅ ${user.user.tag} muteado por ${tiempo} minutos.` });

    logChannel.send({ embeds: [new EmbedBuilder().setTitle('🔇 Usuario Muteado').setDescription(`${user.user.tag} muteado por ${tiempo} minutos\nRazón: ${razon}`).setColor('#FF4500').setTimestamp()] });

    if (tiempo > 0) {
      setTimeout(async () => {
        await user.roles.remove(mutedRole).catch(console.error);
        logChannel.send({ embeds: [new EmbedBuilder().setTitle('🔊 Usuario Desmuteado').setDescription(`${user.user.tag} ha sido desmuteado automáticamente.`).setColor('#00FF00').setTimestamp()] });
      }, tiempo * 60000);
    }
  }

  if (commandName === 'ban') {
    if (!canBan) return interaction.reply({ content: '❌ No tienes permiso.', ephemeral: true });
    const user = options.getMember('usuario');
    const razon = options.getString('razon');
    const tiempo = options.getInteger('tiempo'); // minutos, 0 = permaban

    if (tiempo && tiempo > 0) {
      await user.ban({ reason: razon });
      interaction.reply({ content: `✅ ${user.user.tag} baneado temporalmente por ${tiempo} minutos.` });
      setTimeout(async () => {
        await interaction.guild.members.unban(user.id).catch(() => {});
        logChannel.send({ embeds: [new EmbedBuilder().setTitle('♻️ Usuario Desbaneado').setDescription(`${user.user.tag} desbaneado automáticamente.`).setColor('#00FF00').setTimestamp()] });
      }, tiempo * 60000);
    } else {
      await user.ban({ reason: razon });
      interaction.reply({ content: `✅ ${user.user.tag} baneado permanentemente.` });
    }

    logChannel.send({ embeds: [new EmbedBuilder().setTitle('⛔ Usuario Baneado').setDescription(`${user.user.tag} ha sido baneado.\nRazón: ${razon}`).setColor('#FF0000').setTimestamp()] });
  }
});

// --------------------------
// LOGIN BOT
// --------------------------
client.login(process.env.DISCORD_TOKEN);