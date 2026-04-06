const { 
  Client, 
  GatewayIntentBits, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ChannelType, 
  PermissionsBitField, 
  EmbedBuilder,
  Collection
} = require('discord.js');

require('dotenv').config();
const TOKEN = process.env.DISCORD_TOKEN;

// --------------------------
// IDS
// --------------------------
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

// --------------------------
// CLIENT
// --------------------------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

console.log("🚀 Iniciando NERV Bot...");

// --------------------------
// AUTOROL + BIENVENIDA
// --------------------------
client.on('guildMemberAdd', async member => {
  try {
    const rolMiembro = member.guild.roles.cache.get(IDs.roles.miembro);
    if (rolMiembro) await member.roles.add(rolMiembro);

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
    console.error("❌ Error al asignar rol o enviar bienvenida:", error);
  }
});

// --------------------------
// WARN STORAGE
// --------------------------
const warns = new Collection(); // userId -> [{ staff, reason, date }]

// --------------------------
// TIER ROLES
// --------------------------
const tierRoles = {
  postular_t1: { id: '1490563096610078862', name: 'Profesionales', emoji: '🏆', requisitos: 'Jugador RLCS' },
  postular_t2: { id: '1490563098937921748', name: 'Competitivos', emoji: '⚡', requisitos: 'SSL → Grand Champion 3' },
  postular_t3: { id: '1490563101479931964', name: 'Veteranos', emoji: '🎯', requisitos: 'Grand Champion 2 → Champion 3' },
  postular_t4: { id: '1490563105736884325', name: 'Aspirantes', emoji: '📈', requisitos: 'Champion 2 → Diamond 3' },
  postular_t5: { id: '1490563136783126710', name: 'En progreso', emoji: '🔰', requisitos: 'Diamond 2 → Bronze 1' }
};

// --------------------------
// READY: TRYOUTS + TIER PANELS
// --------------------------
client.once('ready', async () => {
  console.log(`🔥 Bot listo como ${client.user.tag}`);

  // --- Tryouts ---
  try {
    const canalApplys = await client.channels.fetch(IDs.channels.apply);
    const mensajes = await canalApplys.messages.fetch({ limit: 1 });
    if (mensajes.size === 0) {
      const botonRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('crear_ticket')
          .setLabel('Abrir Tryout')
          .setStyle(ButtonStyle.Danger)
      );
      await canalApplys.send({ content: "🎟️ Presiona el botón para aplicar al tryout.", components: [botonRow] });
    }
  } catch (error) {
    console.error("❌ Error panel tryouts:", error);
  }

  // --- Tiers ---
  try {
    const canalTiers = await client.channels.fetch(IDs.channels.tiers);
    const mensajesTiers = await canalTiers.messages.fetch({ limit: 5 });

    const embedTiers = new EmbedBuilder()
      .setTitle('🎮 Tiers - Nerv Esports')
      .setDescription('Aquí puedes ver los niveles competitivos de NERV y los rangos que entran en cada tier. Presiona el botón de tu tier para postularte y abrir un ticket.')
      .addFields(
        { name: 'Tier 1 🏆 - Profesionales', value: 'Rango: Jugador RLCS', inline: false },
        { name: 'Tier 2 ⚡ - Competitivos', value: 'Rango: SSL → Grand Champion 3', inline: false },
        { name: 'Tier 3 🎯 - Veteranos', value: 'Rango: Grand Champion 2 → Champion 3', inline: false },
        { name: 'Tier 4 📈 - Aspirantes', value: 'Rango: Champion 2 → Diamond 3', inline: false },
        { name: 'Tier 5 🔰 - En progreso', value: 'Rango: Diamond 2 → Bronze 1', inline: false }
      )
      .setColor('#E10600')
      .setThumbnail('https://media.discordapp.net/attachments/1490445497318641670/1490476067981496481/nerv_logo.png')
      .setFooter({ text: '⚡ Nerv Esports - Compite, mejora y disfruta!' });

    const botonesTiers = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('postular_t1').setLabel('🏆 Profesionales').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('postular_t2').setLabel('⚡ Competitivos').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('postular_t3').setLabel('🎯 Veteranos').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('postular_t4').setLabel('📈 Aspirantes').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('postular_t5').setLabel('🔰 En progreso').setStyle(ButtonStyle.Danger)
    );

    if (mensajesTiers.size === 0) {
      await canalTiers.send({ embeds: [embedTiers], components: [botonesTiers] });
      console.log('✅ Embed de Tiers enviado.');
    }

  } catch (error) {
    console.error('❌ Error enviando embed de Tiers:', error);
  }
});

// --------------------------
// INTERACTIONS: TICKETS + TIER
// --------------------------
client.on('interactionCreate', async interaction => {
  if (interaction.isButton()) {

    // ----- Tryout -----
    if (interaction.customId === 'crear_ticket') {
      await interaction.deferReply({ ephemeral: true });
      try {
        const nombre = interaction.user.username.replace(/[^a-zA-Z0-9]/g, "") || 'usuario';
        const categoria = interaction.guild.channels.cache.get(IDs.channels.tryoutsCategory);
        if (!categoria) throw new Error("Categoría de tickets no encontrada.");

        const rolesParaVer = IDs.roles.staffRoles.map(id => interaction.guild.roles.cache.get(id))
          .filter(r => r)
          .map(r => ({ id: r.id, allow: [PermissionsBitField.Flags.ViewChannel] }));

        const permisoOverwrites = [
          { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel] },
          ...rolesParaVer
        ];

        const ticket = await interaction.guild.channels.create({
          name: `tryout-${nombre}`,
          type: ChannelType.GuildText,
          parent: categoria.id,
          permissionOverwrites: permisoOverwrites
        });

        const embedTicket = new EmbedBuilder()
          .setTitle(`🎯 Tryout de ${interaction.user.username}`)
          .setDescription("Responde las siguientes preguntas dentro de este ticket:\n- Rango actual\n- Plataforma\n- Horas jugadas\n- ¿Por qué quieres unirte a NERV?")
          .setColor('#00FFFF');

        const cerrarRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('cerrar_ticket').setLabel('❌ Cerrar Ticket').setStyle(ButtonStyle.Danger)
        );

        await ticket.send({ embeds: [embedTicket], components: [cerrarRow] });
        await interaction.editReply({ content: `✅ Ticket creado: ${ticket}` });

      } catch (error) {
        console.error("❌ ERROR REAL:", error);
        await interaction.editReply({ content: `❌ Error creando el ticket: ${error.message}` });
      }
    }

    // ----- Tiers -----
    if (Object.keys(tierRoles).includes(interaction.customId)) {
      await interaction.deferReply({ ephemeral: true });
      try {
        const tier = tierRoles[interaction.customId];
        const nombreUsuario = interaction.user.username.replace(/[^a-zA-Z0-9]/g, "") || 'usuario';
        const categoria = interaction.guild.channels.cache.get(IDs.channels.tryoutsCategory);

        const rolesParaVer = IDs.roles.staffRoles.map(id => interaction.guild.roles.cache.get(id))
          .filter(r => r)
          .map(r => ({ id: r.id, allow: [PermissionsBitField.Flags.ViewChannel] }));

        const permisoOverwrites = [
          { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel] },
          ...rolesParaVer
        ];

        const ticket = await interaction.guild.channels.create({
          name: `tier-${nombreUsuario}`,
          type: ChannelType.GuildText,
          parent: categoria.id,
          permissionOverwrites: permisoOverwrites
        });

        // Asignar rol del Tier
        const rolTier = interaction.guild.roles.cache.get(tier.id);
        if (rolTier) await interaction.member.roles.add(rolTier);

        const embedTicket = new EmbedBuilder()
          .setTitle(`🎮 Postulación para Tiers`)
          .setDescription(`¡Estás por postularte al **${tier.name} ${tier.emoji}**!\n\n**Requisitos:** ${tier.requisitos}\n**Rango actual:** Indica tu rango actual\n**Prueba:** Envía evidencia de tu nivel actual\n**ID del juego:** Tu ID para verificación`)
          .setColor('#00FFFF');

        const cerrarRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('cerrar_ticket').setLabel('❌ Cerrar Ticket').setStyle(ButtonStyle.Danger)
        );

        await ticket.send({ embeds: [embedTicket], components: [cerrarRow] });
        await interaction.editReply({ content: `✅ Ticket creado: ${ticket}` });

      } catch (error) {
        console.error("❌ Error creando ticket por Tier:", error);
        await interaction.editReply({ content: `❌ Error creando ticket: ${error.message}` });
      }
    }

    // ----- Cerrar ticket -----
    if (interaction.customId === 'cerrar_ticket') {
      await interaction.reply({ content: '🧹 Cerrando ticket...', ephemeral: true });
      setTimeout(() => {
        interaction.channel.delete().catch(console.error);
      }, 2000);
    }
  }

  // ----- Comandos de moderación -----
  if (interaction.isChatInputCommand()) {
    const member = interaction.options.getMember('usuario');
    const razon = interaction.options.getString('razon') || 'No especificada';
    const logChannel = interaction.guild.channels.cache.get(IDs.channels.staffLog);

    if (!interaction.member.roles.cache.some(r => IDs.roles.staffRoles.includes(r.id))) {
      return interaction.reply({ content: '❌ No tienes permisos.', ephemeral: true });
    }

    // WARN
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

    // MUTE
    if (interaction.commandName === 'mute') {
      const duracion = interaction.options.getString('duracion') || '10m';
      const muteRole = interaction.guild.roles.cache.get(IDs.roles.muted);
      if (!muteRole) return interaction.reply({ content: '❌ Rol Muted no existe', ephemeral: true });

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

    // UNMUTE
    if (interaction.commandName === 'unmute') {
      const muteRole = interaction.guild.roles.cache.get(IDs.roles.muted);
      if (!muteRole) return interaction.reply({ content: '❌ Rol Muted no existe', ephemeral: true });
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

    // BAN
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

    // UNBAN
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

    // PING
    if (interaction.commandName === 'ping') {
      await interaction.reply({ content: '🏓 Pong!', ephemeral: true });
    }
  }
});

// --------------------------
// LOGIN BOT
// --------------------------
client.login(TOKEN);