const { 
  Client, 
  GatewayIntentBits, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ChannelType, 
  PermissionsBitField, 
  EmbedBuilder, 
  StringSelectMenuBuilder 
} = require('discord.js');

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
// AUTO-ROL MIEMBRO + BIENVENIDA
// --------------------------
client.on('guildMemberAdd', async member => {
  try {
    const rolMiembro = member.guild.roles.cache.get('1490466327045869628'); 
    if (rolMiembro) await member.roles.add(rolMiembro);

    const canalBienvenida = member.guild.channels.cache.get('1490483811664924883');
    if (canalBienvenida) {
      const embedBienvenida = new EmbedBuilder()
        .setTitle('🎉 ¡Bienvenido a NERV! ⚡')
        .setDescription(`¡Nos alegra tenerte en el servidor, ${member.user.username}! Aquí podrás mejorar, competir y formar parte de la comunidad NERV.`)
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
// PANEL TRYOUTS + TIERS
// --------------------------
client.once('ready', async () => {
  console.log(`🔥 Bot listo como ${client.user.tag}`);

  // --- Tryouts ---
  try {
    const canalApplys = await client.channels.fetch('1490462939361312941');
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
    const canalTiers = await client.channels.fetch('1490565371294650488'); // Canal Tiers
    const mensajesTiers = await canalTiers.messages.fetch({ limit: 5 });

    const embedTiers = new EmbedBuilder()
      .setTitle('🎮 Tiers - NERV Esports')
      .setDescription('Presiona el botón de tu tier para postularte y abrir un ticket.')
      .addFields(
        { name: 'Tier 1 🏆 - Profesionales', value: 'Rango: Jugador RLCS', inline: false },
        { name: 'Tier 2 ⚡ - Competitivos', value: 'Rango: SSL → Grand Champion 3', inline: false },
        { name: 'Tier 3 🎯 - Veteranos', value: 'Rango: Grand Champion 2 → Champion 3', inline: false },
        { name: 'Tier 4 📈 - Aspirantes', value: 'Rango: Champion 2 → Diamond 3', inline: false },
        { name: 'Tier 5 🔰 - En progreso', value: 'Rango: Diamond 2 → Bronze 1', inline: false }
      )
      .setColor('#E10600')
      .setThumbnail('https://media.discordapp.net/attachments/1490445497318641670/1490476067981496481/nerv_logo.png')
      .setFooter({ text: '⚡ NERV Esports - Compite, mejora y disfruta!' });

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
// TICKETS Y FORMULARIOS
// --------------------------
const tierRoles = {
  postular_t1: { id: '1490563096610078862', name: 'Profesionales', opciones: ['Jugador RLCS'], requisitos: 'Jugador RLCS' },
  postular_t2: { id: '1490563098937921748', name: 'Competitivos', opciones: ['SSL', 'Grand Champion 3'], requisitos: 'SSL → Grand Champion 3' },
  postular_t3: { id: '1490563101479931964', name: 'Veteranos', opciones: ['Grand Champion 2', 'Grand Champion 1', 'Champion 3'], requisitos: 'Grand Champion 2 → Champion 3' },
  postular_t4: { id: '1490563105736884325', name: 'Aspirantes', opciones: ['Champion 2', 'Champion 1', 'Diamond 3'], requisitos: 'Champion 2 → Diamond 3' },
  postular_t5: { id: '1490563136783126710', name: 'En progreso', opciones: ['Diamond 2','Diamond 1','Platino 3','Platino 2','Platino 1','Oro 3','Oro 2','Oro 1','Rangos inferiores'], requisitos: 'Diamond 2 → Bronze 1' }
};

client.on('interactionCreate', async interaction => {
  if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

  // --- TRYOUT ---
  if (interaction.isButton() && interaction.customId === 'crear_ticket') {
    await interaction.showModal({
      title: "Formulario Tryout",
      customId: "form_tryout",
      components: [
        new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('tryout_id')
            .setPlaceholder('Ingresa tu ID de juego')
            .addOptions([{ label: 'ID de juego', value: 'id_juego' }])
        ),
        new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('tryout_rango')
            .setPlaceholder('Rango actual')
            .addOptions([
              { label: 'Bronce', value: 'Bronce' },
              { label: 'Plata', value: 'Plata' },
              { label: 'Oro', value: 'Oro' },
              { label: 'Platino', value: 'Platino' },
              { label: 'Diamante', value: 'Diamante' },
              { label: 'Champion', value: 'Champion' },
              { label: 'Grand Champion', value: 'Grand Champion' },
              { label: 'RLCS Player', value: 'RLCS Player' }
            ])
        )
      ]
    });
  }

  // --- TIER TICKET ---
  if (interaction.isButton() && Object.keys(tierRoles).includes(interaction.customId)) {
    await interaction.deferReply({ ephemeral: true });
    try {
      const tier = tierRoles[interaction.customId];
      const nombreUsuario = interaction.user.username.replace(/[^a-zA-Z0-9]/g, "") || 'usuario';
      const categoria = interaction.guild.channels.cache.get('1490462544798810173'); // Categoría Tryouts
      const rolesParaVer = [
        '1490466019720822884', // Owner
        '1490466026356342804', // Admin
        '1490466028545769473'  // Mod
      ].map(id => interaction.guild.roles.cache.get(id))
        .filter(role => role)
        .map(role => ({ id: role.id, allow: [PermissionsBitField.Flags.ViewChannel] }));

      const permisoOverwrites = [
        { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel] },
        ...rolesParaVer,
        { id: '1490472100304257175', allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageChannels] }
      ];

      const ticket = await interaction.guild.channels.create({
        name: `tier-${nombreUsuario}`,
        type: ChannelType.GuildText,
        parent: categoria.id,
        permissionOverwrites: permisoOverwrites
      });

      const rolTier = interaction.guild.roles.cache.get(tier.id);
      if (rolTier) await interaction.member.roles.add(rolTier);

      const embedTicket = new EmbedBuilder()
        .setTitle(`🎮 Postulación para Tier ${tier.name}`)
        .setDescription(`¡Estás por postularte al **${tier.name}**!\n**Requisitos:** ${tier.requisitos}\n**Rango actual (verificaremos en Rocket Tracker):**\n**ID del juego:** Tu ID para verificación`)
        .setColor('#00FFFF')
        .setThumbnail('https://media.discordapp.net/attachments/1490445497318641670/1490476067981496481/nerv_logo.png')
        .setFooter({ text: '⚡ NERV - Compite, mejora y disfruta!' });

      const cerrarRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('cerrar_ticket')
          .setLabel('❌ Cerrar Ticket')
          .setStyle(ButtonStyle.Danger)
      );

      await ticket.send({ embeds: [embedTicket], components: [cerrarRow] });
      await interaction.editReply({ content: `✅ Ticket creado: ${ticket}` });

    } catch (error) {
      console.error("❌ Error creando ticket por Tier:", error);
      await interaction.editReply({ content: `❌ Error creando ticket: ${error.message}` });
    }
  }

  // --- CERRAR TICKET ---
  if (interaction.isButton() && interaction.customId === 'cerrar_ticket') {
    await interaction.reply({ content: '🧹 Cerrando ticket...', ephemeral: true });
    setTimeout(() => {
      interaction.channel.delete().catch(console.error);
    }, 2000);
  }
});

// --------------------------
// MODERACIÓN
// --------------------------
const warns = {};

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const staffChannel = interaction.guild.channels.cache.get('1490581213159620659');

  if (interaction.commandName === 'warn') {
    const member = interaction.options.getMember('usuario');
    const razon = interaction.options.getString('razon');
    if (!warns[member.id]) warns[member.id] = [];
    warns[member.id].push({ razon, staff: interaction.user.tag, fecha: new Date().toLocaleString() });

    const embed = new EmbedBuilder()
      .setTitle('⚠️ Usuario Advertido')
      .setDescription(`${member} ha recibido un warn.`)
      .addFields(
        { name: 'Razón', value: razon },
        { name: 'Staff', value: interaction.user.tag },
        { name: 'Total Warns', value: warns[member.id].length.toString() }
      )
      .setColor('#FFA500');

    await interaction.reply({ content: '✅ Usuario advertido.', ephemeral: true });
    if (staffChannel) staffChannel.send({ embeds: [embed] });
  }

  if (interaction.commandName === 'mute') {
    const member = interaction.options.getMember('usuario');
    const rolMuted = interaction.guild.roles.cache.get('1490587338697609257');
    const duracion = interaction.options.getInteger('minutos');

    if (rolMuted && member) {
      await member.roles.add(rolMuted);
      const embed = new EmbedBuilder()
        .setTitle('🔇 Usuario Muted')
        .setDescription(`${member} ha sido silenciado por ${duracion} minutos.`)
        .setColor('#FF0000');

      await interaction.reply({ content: '✅ Usuario muted.', ephemeral: true });
      if (staffChannel) staffChannel.send({ embeds: [embed] });

      setTimeout(async () => {
        if (member.roles.cache.has(rolMuted.id)) await member.roles.remove(rolMuted);
      }, duracion * 60 * 1000);
    }
  }

  if (interaction.commandName === 'unmute') {
    const member = interaction.options.getMember('usuario');
    const rolMuted = interaction.guild.roles.cache.get('1490587338697609257');
    if (rolMuted && member) {
      await member.roles.remove(rolMuted);
      const embed = new EmbedBuilder()
        .setTitle('🔊 Usuario Unmuted')
        .setDescription(`${member} ha sido desmuted.`)
        .setColor('#00FF00');
      await interaction.reply({ content: '✅ Usuario desmuted.', ephemeral: true });
      if (staffChannel) staffChannel.send({ embeds: [embed] });
    }
  }

  if (interaction.commandName === 'ban') {
    const member = interaction.options.getMember('usuario');
    const razon = interaction.options.getString('razon');
    if (member) {
      await member.ban({ reason: razon });
      const embed = new EmbedBuilder()
        .setTitle('⛔ Usuario Baneado')
        .setDescription(`${member} ha sido baneado.`)
        .addFields({ name: 'Razón', value: razon })
        .setColor('#FF0000');
      await interaction.reply({ content: '✅ Usuario baneado.', ephemeral: true });
      if (staffChannel) staffChannel.send({ embeds: [embed] });
    }
  }

  if (interaction.commandName === 'unban') {
    const id = interaction.options.getString('id');
    try {
      await interaction.guild.members.unban(id);
      const embed = new EmbedBuilder()
        .setTitle('✅ Usuario Unbanned')
        .setDescription(`Se ha desbaneado al usuario con ID: ${id}`)
        .setColor('#00FF00');
      await interaction.reply({ content: '✅ Usuario desbaneado.', ephemeral: true });
      if (staffChannel) staffChannel.send({ embeds: [embed] });
    } catch {
      await interaction.reply({ content: '❌ No se pudo desbanear el usuario.', ephemeral: true });
    }
  }
});

// --------------------------
// LOGIN BOT
// --------------------------
client.login(process.env.DISCORD_TOKEN);