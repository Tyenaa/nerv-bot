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
const fs = require('fs');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMembers, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent
  ]
});

console.log("🚀 Iniciando NERV Bot...");

// ----------------- AUTO-ROL + BIENVENIDA -----------------
client.on('guildMemberAdd', async member => {
  try {
    const rolMiembro = member.guild.roles.cache.get('1490466327045869628'); 
    if (rolMiembro) await member.roles.add(rolMiembro);

    const canalBienvenida = member.guild.channels.cache.get('1490483811664924883');
    if (canalBienvenida) {
      const embedBienvenida = new EmbedBuilder()
        .setTitle('🎉 ¡Bienvenido a NERV! ⚡')
        .setDescription(`¡Nos alegra tenerte en el servidor, ${member.user.username}!`)
        .setImage('https://media.discordapp.net/attachments/1490445497318641670/1490484413081845830/Gemini_Generated_Image_sqh3sisqh3sisqh3_1.png')
        .setThumbnail('https://media.discordapp.net/attachments/1490445497318641670/1490476067981496481/nerv_logo.png')
        .setColor('#8A2BE2')
        .setFooter({ text: '⚡ ¡Compite, mejora y disfruta! - NERV' });

      await canalBienvenida.send({ embeds: [embedBienvenida] });
    }
  } catch (error) { console.error("❌ Error bienvenida:", error); }
});

// ----------------- PANEL TRYOUTS + TIERS -----------------
client.once('ready', async () => {
  console.log(`🔥 Bot listo como ${client.user.tag}`);

  // Panel Tryouts
  try {
    const canalApplys = await client.channels.fetch('1490462939361312941'); 
    const mensajes = await canalApplys.messages.fetch({ limit: 1 });
    if (mensajes.size === 0) {
      const botonRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('crear_ticket').setLabel('Abrir Tryout').setStyle(ButtonStyle.Danger)
      );
      await canalApplys.send({ content: "🎟️ Presiona el botón para aplicar al tryout.", components: [botonRow] });
    }
  } catch (error) { console.error("❌ Error panel Tryouts:", error); }

  // Panel Tiers
  try {
    const canalTiers = await client.channels.fetch('1490565371294650488'); 
    const mensajesTiers = await canalTiers.messages.fetch({ limit: 5 });

    const embedTiers = new EmbedBuilder()
      .setTitle('🎮 Tiers - Nerv Esports')
      .setDescription('Presiona el botón de tu tier para postularte.')
      .addFields(
        { name: 'Tier 1 🏆', value: 'Rango: Jugador RLCS', inline: false },
        { name: 'Tier 2 ⚡', value: 'Rango: SSL → Grand Champion 3', inline: false },
        { name: 'Tier 3 🎯', value: 'Rango: Grand Champion 2 → Champion 3', inline: false },
        { name: 'Tier 4 📈', value: 'Rango: Champion 2 → Diamond 3', inline: false },
        { name: 'Tier 5 🔰', value: 'Rango: Diamond 2 → Bronze 1', inline: false }
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
    }
  } catch (error) { console.error('❌ Error panel Tiers:', error); }
});

// ----------------- TIER ROLES -----------------
const tierRoles = {
  postular_t1: { name: 'Tier 1', rangos: 'Player RLCS' },
  postular_t2: { name: 'Tier 2', rangos: 'SSL, Grand Champion 3' },
  postular_t3: { name: 'Tier 3', rangos: 'Grand Champion 2, Grand Champion 1, Champion 3' },
  postular_t4: { name: 'Tier 4', rangos: 'Champion 2, Champion 1, Diamond 3' },
  postular_t5: { name: 'Tier 5', rangos: 'Diamond 2, Diamond 1, Platinum 3, Platinum 2, Platinum 1, Gold 3, Gold 2, Gold 1, Inferior' }
};

// ----------------- INTERACCIONES -----------------
client.on('interactionCreate', async interaction => {
  if (interaction.isButton()) {
    if (interaction.customId === 'crear_ticket') {
      const modal = new ModalBuilder().setCustomId('apply_modal').setTitle('Formulario Tryout');
      modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('game_id').setLabel('ID de juego').setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('rango_actual').setLabel('Rango actual').setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('horas_jugadas').setLabel('Horas jugadas').setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('porque_unirte').setLabel('¿Por qué unirte?').setStyle(TextInputStyle.Paragraph).setRequired(true))
      );
      await interaction.showModal(modal);
    }

    if (tierRoles[interaction.customId]) {
      const tier = tierRoles[interaction.customId];
      const modal = new ModalBuilder().setCustomId(`tier_modal_${interaction.customId}`).setTitle(`Formulario ${tier.name}`);
      modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('game_id').setLabel('ID de juego').setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('rango_actual').setLabel(`Rango actual: ${tier.rangos}`).setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('verificacion').setLabel('Se verificará tu rango en Rocket Tracker').setStyle(TextInputStyle.Paragraph))
      );
      await interaction.showModal(modal);
    }

    if (interaction.customId === 'cerrar_ticket') {
      await interaction.reply({ content: '🧹 Cerrando ticket...', ephemeral: true });
      setTimeout(() => { interaction.channel.delete().catch(console.error); }, 2000);
    }
  }

  if (interaction.isModalSubmit()) {
    await interaction.deferReply({ ephemeral: true });
    const isTryout = interaction.customId === 'apply_modal';
    const isTier = interaction.customId.startsWith('tier_modal_');

    if (!isTryout && !isTier) return;

    const gameId = interaction.fields.getTextInputValue('game_id');
    const rango = interaction.fields.getTextInputValue('rango_actual');
    const verificacion = isTier ? interaction.fields.getTextInputValue('verificacion') : '';
    const horas = isTryout ? interaction.fields.getTextInputValue('horas_jugadas') : '';
    const motivo = isTryout ? interaction.fields.getTextInputValue('porque_unirte') : '';

    try {
      const nombreUsuario = interaction.user.username.replace(/[^a-zA-Z0-9]/g, "") || 'usuario';
      const categoria = interaction.guild.channels.cache.get('1490462544798810173'); 

      const rolesParaVer = [
        '1490466019720822884', 
        '1490466026356342804', 
        '1490466028545769473'
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
        name: `${isTryout ? 'tryout' : 'tier'}-${nombreUsuario}`,
        type: ChannelType.GuildText,
        parent: categoria.id,
        permissionOverwrites: permisoOverwrites
      });

      const embed = new EmbedBuilder().setColor('#00FFFF').setThumbnail('https://media.discordapp.net/attachments/1490445497318641670/1490476067981496481/nerv_logo.png')
        .setFooter({ text: '⚡ NERV - Compite, mejora y disfruta!' })
        .setTitle(`${isTryout ? '🎯 Tryout' : '🎮 Postulación a Tier'} de ${interaction.user.username}`);

      if (isTryout) embed.setDescription(`**ID:** ${gameId}\n**Rango:** ${rango}\n**Horas:** ${horas}\n**Motivo:** ${motivo}`);
      else embed.setDescription(`**ID:** ${gameId}\n**Rango:** ${rango}\n**Verificación:** ${verificacion}`);

      const cerrarRow = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('cerrar_ticket').setLabel('❌ Cerrar Ticket').setStyle(ButtonStyle.Danger));
      await ticket.send({ embeds: [embed], components: [cerrarRow] });
      await interaction.editReply({ content: `✅ Ticket creado: ${ticket}`, ephemeral: true });

    } catch (error) {
      console.error("❌ Error creando ticket:", error);
      await interaction.editReply({ content: `❌ Error creando ticket: ${error.message}`, ephemeral: true });
    }
  }
});

// ----------------- MODERACIÓN CON JSON -----------------
const warnsFile = './warns.json';
let warns = {};
if (fs.existsSync(warnsFile)) warns = JSON.parse(fs.readFileSync(warnsFile, 'utf-8'));

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const logChannel = interaction.guild.channels.cache.get('1490581213159620659');
  const mutedRoleId = '1490587338697609257';

  const saveWarns = () => fs.writeFileSync(warnsFile, JSON.stringify(warns, null, 2));

  const usuario = interaction.options?.getUser('usuario') || interaction.options?.getMember('usuario');

  if (interaction.commandName === 'warn') {
    const razon = interaction.options.getString('razon');
    if (!warns[usuario.id]) warns[usuario.id] = 0;
    warns[usuario.id]++;
    saveWarns();
    await interaction.reply(`⚠️ ${usuario.tag} ha sido advertido. Total warns: ${warns[usuario.id]}`);

    const embed = new EmbedBuilder()
      .setTitle('⚠️ Warn')
      .addFields(
        { name: 'Usuario', value: usuario.tag, inline: true },
        { name: 'Moderador', value: interaction.user.tag, inline: true },
        { name: 'Razón', value: razon, inline: false },
        { name: 'Total Warns', value: `${warns[usuario.id]}`, inline: true }
      ).setColor('#FFA500');
    if (logChannel) logChannel.send({ embeds: [embed] });
  }

  if (interaction.commandName === 'mute') {
    const member = interaction.options.getMember('usuario');
    const razon = interaction.options.getString('razon');
    const rolMuted = interaction.guild.roles.cache.get(mutedRoleId);
    if (rolMuted && member) { await member.roles.add(rolMuted); interaction.reply(`🔇 ${member.user.tag} muteado.`); }
  }

  if (interaction.commandName === 'unmute') {
    const member = interaction.options.getMember('usuario');
    const rolMuted = interaction.guild.roles.cache.get(mutedRoleId);
    if (rolMuted && member) { await member.roles.remove(rolMuted); interaction.reply(`🔊 ${member.user.tag} desmuteado.`); }
  }

  if (interaction.commandName === 'ban') {
    const member = interaction.options.getMember('usuario');
    const razon = interaction.options.getString('razon');
    if (member) { await member.ban({ reason: razon }); interaction.reply(`⛔ ${member.user.tag} baneado.`); }
  }

  if (interaction.commandName === 'unban') {
    const userId = interaction.options.getString('userid');
    await interaction.guild.members.unban(userId).catch(console.error);
    await interaction.reply(`✅ Usuario con ID ${userId} desbaneado.`);
  }
});

client.login(process.env.DISCORD_TOKEN);