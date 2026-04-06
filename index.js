const { 
  Client, 
  GatewayIntentBits, 
  Partials,
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ChannelType, 
  PermissionsBitField, 
  EmbedBuilder,
  Events,
  REST,
  Routes,
  SlashCommandBuilder
} = require('discord.js');

require('dotenv').config();

const TOKEN = process.env.DISCORD_TOKEN;

// -----------------
// CONFIGURACIÓN DE IDs
// -----------------
const IDs = {
  roles: {
    member: '1490466327045869628',
    muted: 'MUTED_ROLE_ID_HERE',
    staffRoles: {
      owner: '1490466019720822884',
      admin: '1490466026356342804',
      mod: '1490466028545769473',
      helper: '1490466913237602324'
    }
  },
  channels: {
    welcome: '1490483811664924883',
    staffLog: 'STAFF_LOG_CHANNEL_ID',
    apply: '1490462939361312941',
    tryoutsCategory: '1490462544798810173',
    tiers: '1490565371294650488',
    reglas: '1490450067860230235'
  },
  tiersRoles: {
    t1: '1490563096610078862',
    t2: '1490563098937921748',
    t3: '1490563101479931964',
    t4: '1490563105736884325',
    t5: '1490563136783126710'
  }
};

// -----------------
// CLIENTE
// -----------------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

console.log("🚀 Iniciando NERV Bot...");

// -----------------
// BIENVENIDA Y AUTOROL
// -----------------
client.on('guildMemberAdd', async member => {
  try {
    // Autorol
    const rolMiembro = member.guild.roles.cache.get(IDs.roles.member);
    if (rolMiembro) await member.roles.add(rolMiembro);

    // Embed bienvenida
    const canalBienvenida = member.guild.channels.cache.get(IDs.channels.welcome);
    if (canalBienvenida) {
      const embed = new EmbedBuilder()
        .setTitle('🎉 ¡Bienvenido a NERV! ⚡')
        .setDescription(`¡Nos alegra tenerte en el servidor, ${member.user.username}! Recuerda leer las reglas y tomar tu rol.`)
        .setImage('https://media.discordapp.net/attachments/1490445497318641670/1490484413081845830/Gemini_Generated_Image_sqh3sisqh3sisqh3_1.png')
        .setColor('#8A2BE2')
        .setFooter({ text: '⚡ ¡Compite, mejora y disfruta! - NERV' });

      await canalBienvenida.send({ embeds: [embed] });
    }
  } catch (error) {
    console.error("❌ Error bienvenida:", error);
  }
});

// -----------------
// PING
// -----------------
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'ping') {
    await interaction.reply({ content: `🏓 Pong! Latencia: ${client.ws.ping}ms` });
  }
});

// -----------------
// MODERACIÓN
// -----------------
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const member = interaction.options.getMember('usuario');
  const razon = interaction.options.getString('razon') || 'No especificada';
  const staffRoles = Object.values(IDs.roles.staffRoles);

  if (!interaction.member.roles.cache.some(r => staffRoles.includes(r.id))) {
    return interaction.reply({ content: '❌ No tienes permisos para usar este comando.', ephemeral: true });
  }

  const logChannel = interaction.guild.channels.cache.get(IDs.channels.staffLog);

  // WARN
  if (interaction.commandName === 'warn') {
    await interaction.reply({ content: `⚠️ ${member.user.tag} ha sido advertido.\nRazón: ${razon}` });
    if (logChannel) logChannel.send(`⚠️ **Warn:** ${member.user.tag} | Razón: ${razon} | Staff: ${interaction.user.tag}`);
  }

  // MUTE
  if (interaction.commandName === 'mute') {
    const duracion = interaction.options.getString('duracion') || '10m';
    const muteRole = interaction.guild.roles.cache.get(IDs.roles.muted);
    if (!muteRole) return interaction.reply({ content: '❌ No existe el rol Muted.', ephemeral: true });

    await member.roles.add(muteRole);
    await interaction.reply({ content: `🔇 ${member.user.tag} ha sido muteado por ${duracion}.` });
    if (logChannel) logChannel.send(`🔇 **Mute:** ${member.user.tag} | Duración: ${duracion} | Razón: ${razon} | Staff: ${interaction.user.tag}`);

    const match = duracion.match(/^(\d+)([m,h])$/);
    if (match) {
      let time = parseInt(match[1]);
      if (match[2] === 'h') time *= 60;
      setTimeout(() => member.roles.remove(muteRole).catch(console.error), time * 60 * 1000);
    }
  }

  // UNMUTE
  if (interaction.commandName === 'unmute') {
    const muteRole = interaction.guild.roles.cache.get(IDs.roles.muted);
    if (!muteRole) return interaction.reply({ content: '❌ No existe el rol Muted.', ephemeral: true });

    await member.roles.remove(muteRole);
    await interaction.reply({ content: `🔊 ${member.user.tag} ha sido desmuteado.` });
    if (logChannel) logChannel.send(`🔊 **Unmute:** ${member.user.tag} | Staff: ${interaction.user.tag}`);
  }

  // BAN
  if (interaction.commandName === 'ban') {
    await member.ban({ reason: razon });
    await interaction.reply({ content: `⛔ ${member.user.tag} ha sido baneado.\nRazón: ${razon}` });
    if (logChannel) logChannel.send(`⛔ **Ban:** ${member.user.tag} | Razón: ${razon} | Staff: ${interaction.user.tag}`);
  }

  // UNBAN
  if (interaction.commandName === 'unban') {
    const userId = interaction.options.getString('usuario_id');
    await interaction.guild.bans.remove(userId);
    await interaction.reply({ content: `✅ Usuario con ID ${userId} ha sido desbaneado.` });
    if (logChannel) logChannel.send(`✅ **Unban:** ID ${userId} | Staff: ${interaction.user.tag}`);
  }
});

// -----------------
// TRYOUTS Y TIERS
// -----------------
client.once('ready', async () => {
  console.log(`🔥 Bot listo como ${client.user.tag}`);

  const panelConfig = [
    { canalId: IDs.channels.apply, customId: 'crear_ticket_tryout', label: 'Abrir Tryout', style: ButtonStyle.Danger },
    { canalId: IDs.channels.tiers, customId: 'crear_ticket_tier', label: 'Abrir Tier', style: ButtonStyle.Primary }
  ];

  for (const p of panelConfig) {
    try {
      const canal = await client.channels.fetch(p.canalId);
      const mensajes = await canal.messages.fetch({ limit: 1 });

      if (mensajes.size === 0) {
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(p.customId).setLabel(p.label).setStyle(p.style)
        );

        await canal.send({
          content: `🎟️ Presiona el botón para ${p.label.toLowerCase()}.`,
          components: [row]
        });
      }
    } catch (error) {
      console.error("❌ Error creando panel:", error);
    }
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  // Configuración de roles visibles y permisos
  const rolesStaff = [
    IDs.roles.staffRoles.owner,
    IDs.roles.staffRoles.admin,
    IDs.roles.staffRoles.mod
  ].map(id => interaction.guild.roles.cache.get(id))
    .filter(r => r)
    .map(r => ({ id: r.id, allow: [PermissionsBitField.Flags.ViewChannel] }));

  // ----------------- TICKETS TRYOUTS -----------------
  if (interaction.customId === 'crear_ticket_tryout') {
    await interaction.deferReply({ ephemeral: true });
    const categoria = interaction.guild.channels.cache.get(IDs.channels.tryoutsCategory);

    const ticket = await interaction.guild.channels.create({
      name: `tryout-${interaction.user.username.replace(/[^a-zA-Z0-9]/g,'')}`,
      type: ChannelType.GuildText,
      parent: categoria.id,
      permissionOverwrites: [
        { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel] },
        ...rolesStaff
      ]
    });

    const embed = new EmbedBuilder()
      .setTitle(`🎯 Tryout de ${interaction.user.username}`)
      .setDescription("Responde las siguientes preguntas dentro de este ticket:\n- Rango actual\n- Plataforma\n- Horas jugadas\n- ¿Por qué quieres unirte a NERV?")
      .setColor('#00FFFF');

    const cerrarRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('cerrar_ticket').setLabel('❌ Cerrar Ticket').setStyle(ButtonStyle.Danger)
    );

    await ticket.send({ embeds: [embed], components: [cerrarRow] });
    await interaction.editReply({ content: `✅ Ticket creado: ${ticket}` });
  }

  // ----------------- TICKETS TIERS -----------------
  if (interaction.customId === 'crear_ticket_tier') {
    await interaction.deferReply({ ephemeral: true });
    const categoria = interaction.guild.channels.cache.get(IDs.channels.tryoutsCategory);

    const ticket = await interaction.guild.channels.create({
      name: `tier-${interaction.user.username.replace(/[^a-zA-Z0-9]/g,'')}`,
      type: ChannelType.GuildText,
      parent: categoria.id,
      permissionOverwrites: [
        { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel] },
        ...rolesStaff
      ]
    });

    const embed = new EmbedBuilder()
      .setTitle(`📊 Aplicación de TIER de ${interaction.user.username}`)
      .setDescription(
        "Indica tu Tier:\n" +
        "🏆 Tier 1 - Profesionales\n" +
        "⚡ Tier 2 - Competitivos\n" +
        "🎯 Tier 3 - Veteranos\n" +
        "📈 Tier 4 - Aspirantes\n" +
        "🔰 Tier 5 - En progreso"
      )
      .setColor('#FFD700');

    const cerrarRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('cerrar_ticket').setLabel('❌ Cerrar Ticket').setStyle(ButtonStyle.Danger)
    );

    await ticket.send({ embeds: [embed], components: [cerrarRow] });
    await interaction.editReply({ content: `✅ Ticket creado: ${ticket}` });
  }

  // ----------------- CERRAR TICKET -----------------
  if (interaction.customId === 'cerrar_ticket') {
    await interaction.reply({ content: '🧹 Cerrando ticket...', ephemeral: true });
    setTimeout(() => interaction.channel.delete().catch(console.error), 2000);
  }
});

// -----------------
// LOGIN
// -----------------
client.login(TOKEN);