const { 
  Client, 
  GatewayIntentBits, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ChannelType, 
  PermissionsBitField, 
  EmbedBuilder,
  Collection,
  SlashCommandBuilder
} = require('discord.js');

require('dotenv').config();
const TOKEN = process.env.DISCORD_TOKEN;

// -----------------
// IDS
// -----------------
const IDs = {
  roles: {
    miembro: '1490466327045869628',
    muted: '1490587338697609257',
    staffRoles: ['1490466019720822884','1490466026356342804','1490466028545769473'] // owner, admin, mod
  },
  channels: {
    bienvenida: '1490483811664924883',
    reglas: '1490450067860230235',
    tiers: '1490565371294650488',
    apply: '1490462939361312941',
    tryoutsCategory: '1490462544798810173',
    staffLog: '1490581213159620659'
  }
};

// -----------------
// CLIENT
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
// AUTOROL + BIENVENIDA
// -----------------
client.on('guildMemberAdd', async member => {
  try {
    // Dar rol Miembro
    const rolMiembro = member.guild.roles.cache.get(IDs.roles.miembro);
    if (rolMiembro) await member.roles.add(rolMiembro);

    // Embed de bienvenida
    const canalBienvenida = member.guild.channels.cache.get(IDs.channels.bienvenida);
    if (canalBienvenida) {
      const embedBienvenida = new EmbedBuilder()
        .setTitle('🎉 ¡Bienvenido a NERV! ⚡')
        .setDescription(`¡Nos alegra tenerte en el servidor, ${member.user.username}! Aquí podrás mejorar, competir y formar parte de la comunidad NERV.\n\nRecuerda leer las <#${IDs.channels.reglas}> y revisar los roles disponibles en <#${IDs.channels.tiers}>.`)
        .setImage('https://media.discordapp.net/attachments/1490445497318641670/1490484413081845830/Gemini_Generated_Image_sqh3sisqh3sisqh3_1.png')
        .setThumbnail('https://media.discordapp.net/attachments/1490445497318641670/1490476067981496481/nerv_logo.png')
        .setColor('#8A2BE2')
        .setFooter({ text: '⚡ ¡Compite, mejora y disfruta! - NERV' });

      await canalBienvenida.send({ embeds: [embedBienvenida] });
    }
  } catch (error) {
    console.error("❌ Error en bienvenida/autorol:", error);
  }
});

// -----------------
// WARN STORAGE
// -----------------
const warns = new Collection(); // userId -> [{ staff, reason, date }]

// -----------------
// SLASH COMMANDS
// -----------------
client.once('ready', async () => {
  console.log(`🔥 Bot listo como ${client.user.tag}`);

  // Panel Tryouts y Tiers
  const panels = [
    { canalId: IDs.channels.apply, customId: 'crear_ticket_tryout', label: 'Abrir Tryout', style: ButtonStyle.Danger },
    { canalId: IDs.channels.tiers, customId: 'crear_ticket_tier', label: 'Abrir Tier', style: ButtonStyle.Primary }
  ];

  for (const panel of panels) {
    try {
      const canal = await client.channels.fetch(panel.canalId);
      const mensajes = await canal.messages.fetch({ limit: 1 });
      if (mensajes.size === 0) {
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(panel.customId).setLabel(panel.label).setStyle(panel.style)
        );
        await canal.send({ content: `🎟️ Presiona el botón para ${panel.label.toLowerCase()}.`, components: [row] });
      }
    } catch (error) {
      console.error("❌ Error creando panel:", error);
    }
  }
});

// -----------------
// INTERACTIONS
// -----------------
client.on('interactionCreate', async interaction => {
  // Ping
  if (interaction.isChatInputCommand() && interaction.commandName === 'ping') {
    return interaction.reply({ content: '🏓 Pong!', ephemeral: true });
  }

  // Moderación: Slash Commands
  if (interaction.isChatInputCommand()) {
    const member = interaction.options.getMember('usuario');
    const razon = interaction.options.getString('razon') || 'No especificada';
    const logChannel = interaction.guild.channels.cache.get(IDs.channels.staffLog);

    if (!interaction.member.roles.cache.some(r => IDs.roles.staffRoles.includes(r.id))) {
      return interaction.reply({ content: '❌ No tienes permisos para usar este comando.', ephemeral: true });
    }

    // ----- WARN -----
    if (interaction.commandName === 'warn') {
      if (!warns.has(member.id)) warns.set(member.id, []);
      warns.get(member.id).push({ staff: interaction.user.tag, reason: razon, date: new Date() });

      const embed = new EmbedBuilder()
        .setTitle('⚠️ Nuevo Warn')
        .addFields(
          { name: 'Usuario', value: member.user.tag, inline: true },
          { name: 'Staff', value: interaction.user.tag, inline: true },
          { name: 'Razón', value: razon },
          { name: 'Total Warns', value: warns.get(member.id).length.toString(), inline: true }
        )
        .setColor('#FFA500')
        .setTimestamp();

      await interaction.reply({ content: `⚠️ ${member.user.tag} ha sido advertido.`, ephemeral: true });
      if (logChannel) await logChannel.send({ embeds: [embed] });
    }

    // ----- MUTE -----
    if (interaction.commandName === 'mute') {
      const duracion = interaction.options.getString('duracion') || '10m';
      const muteRole = interaction.guild.roles.cache.get(IDs.roles.muted);
      if (!muteRole) return interaction.reply({ content: '❌ No existe el rol Muted.', ephemeral: true });

      await member.roles.add(muteRole);
      const embed = new EmbedBuilder()
        .setTitle('🔇 Usuario Muted')
        .addFields(
          { name: 'Usuario', value: member.user.tag, inline: true },
          { name: 'Staff', value: interaction.user.tag, inline: true },
          { name: 'Duración', value: duracion },
          { name: 'Razón', value: razon }
        )
        .setColor('#FF0000')
        .setTimestamp();

      await interaction.reply({ content: `🔇 ${member.user.tag} ha sido muteado.`, ephemeral: true });
      if (logChannel) await logChannel.send({ embeds: [embed] });

      const match = duracion.match(/^(\d+)([m,h])$/);
      if (match) {
        let time = parseInt(match[1]);
        if (match[2] === 'h') time *= 60;
        setTimeout(() => member.roles.remove(muteRole).catch(console.error), time * 60 * 1000);
      }
    }

    // ----- UNMUTE -----
    if (interaction.commandName === 'unmute') {
      const muteRole = interaction.guild.roles.cache.get(IDs.roles.muted);
      if (!muteRole) return interaction.reply({ content: '❌ No existe el rol Muted.', ephemeral: true });

      await member.roles.remove(muteRole);
      const embed = new EmbedBuilder()
        .setTitle('🔊 Usuario Desmuteado')
        .addFields(
          { name: 'Usuario', value: member.user.tag },
          { name: 'Staff', value: interaction.user.tag }
        )
        .setColor('#00FF00')
        .setTimestamp();

      await interaction.reply({ content: `🔊 ${member.user.tag} ha sido desmuteado.`, ephemeral: true });
      if (logChannel) await logChannel.send({ embeds: [embed] });
    }

    // ----- BAN -----
    if (interaction.commandName === 'ban') {
      await member.ban({ reason: razon });
      const embed = new EmbedBuilder()
        .setTitle('⛔ Usuario Baneado')
        .addFields(
          { name: 'Usuario', value: member.user.tag },
          { name: 'Staff', value: interaction.user.tag },
          { name: 'Razón', value: razon }
        )
        .setColor('#8B0000')
        .setTimestamp();

      await interaction.reply({ content: `⛔ ${member.user.tag} ha sido baneado.`, ephemeral: true });
      if (logChannel) await logChannel.send({ embeds: [embed] });
    }

    // ----- UNBAN -----
    if (interaction.commandName === 'unban') {
      const userId = interaction.options.getString('usuario_id');
      await interaction.guild.bans.remove(userId);
      const embed = new EmbedBuilder()
        .setTitle('✅ Usuario Desbaneado')
        .addFields(
          { name: 'ID', value: userId },
          { name: 'Staff', value: interaction.user.tag }
        )
        .setColor('#00FF00')
        .setTimestamp();

      await interaction.reply({ content: `✅ Usuario con ID ${userId} desbaneado.`, ephemeral: true });
      if (logChannel) await logChannel.send({ embeds: [embed] });
    }
  }

  // ----- BOTONES TRYOUTS / TIERS -----
  if (interaction.isButton()) {
    const rolesStaff = IDs.roles.staffRoles.map(id => interaction.guild.roles.cache.get(id))
      .filter(r => r)
      .map(r => ({ id: r.id, allow: [PermissionsBitField.Flags.ViewChannel] }));

    const categoria = interaction.guild.channels.cache.get(IDs.channels.tryoutsCategory);
    if (!categoria) return;

    if (interaction.customId === 'crear_ticket_tryout' || interaction.customId === 'crear_ticket_tier') {
      await interaction.deferReply({ ephemeral: true });

      const tipo = interaction.customId.includes('tier') ? 'tier' : 'tryout';
      const ticket = await interaction.guild.channels.create({
        name: `${tipo}-${interaction.user.username.replace(/[^a-zA-Z0-9]/g,'')}`,
        type: ChannelType.GuildText,
        parent: categoria.id,
        permissionOverwrites: [
          { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel] },
          ...rolesStaff
        ]
      });

      const embed = new EmbedBuilder()
        .setTitle(tipo === 'tier' ? `📊 Aplicación de TIER de ${interaction.user.username}` : `🎯 Tryout de ${interaction.user.username}`)
        .setDescription(tipo === 'tier' ? 
          "Indica tu Tier:\n🏆 Tier 1 - Profesionales\n⚡ Tier 2 - Competitivos\n🎯 Tier 3 - Veteranos\n📈 Tier 4 - Aspirantes\n🔰 Tier 5 - En progreso" :
          "Responde las preguntas:\n- Rango actual\n- Plataforma\n- Horas jugadas\n- ¿Por qué quieres unirte a NERV?"
        )
        .setColor(tipo === 'tier' ? '#FFD700' : '#00FFFF');

      const cerrarRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('cerrar_ticket').setLabel('❌ Cerrar Ticket').setStyle(ButtonStyle.Danger)
      );

      await ticket.send({ embeds: [embed], components: [cerrarRow] });
      await interaction.editReply({ content: `✅ Ticket creado: ${ticket}` });
    }

    if (interaction.customId === 'cerrar_ticket') {
      await interaction.reply({ content: '🧹 Cerrando ticket...', ephemeral: true });
      setTimeout(() => interaction.channel.delete().catch(console.error), 2000);
    }
  }
});

// -----------------
// LOGIN
// -----------------
client.login(TOKEN);