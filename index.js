const { 
  Client, 
  GatewayIntentBits, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ChannelType, 
  PermissionsBitField, 
  EmbedBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ModalBuilder 
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
// PANEL APPLYs + TIERS
// --------------------------
client.once('ready', async () => {
  console.log(`🔥 Bot listo como ${client.user.tag}`);

  try {
    // --- CANAL APPLYs ---
    const canalApplys = await client.channels.fetch('1490462939361312941');
    const mensajesApplys = await canalApplys.messages.fetch({ limit: 1 });
    if (mensajesApplys.size === 0) {
      const botonRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('apply_button')
          .setLabel('Abrir Tryout')
          .setStyle(ButtonStyle.Danger)
      );
      await canalApplys.send({ content: "🎟️ Presiona el botón para aplicar al tryout.", components: [botonRow] });
    }

    // --- CANAL TIERS ---
    const canalTiers = await client.channels.fetch('1490565371294650488');
    const mensajesTiers = await canalTiers.messages.fetch({ limit: 5 });
    if (mensajesTiers.size === 0) {
      const embedTiers = new EmbedBuilder()
        .setTitle('🎮 Tiers - NERV Esports')
        .setDescription('Presiona el botón de tu tier para postularte y abrir un formulario de postulación.')
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
        new ButtonBuilder().setCustomId('tier1').setLabel('🏆 Profesionales').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('tier2').setLabel('⚡ Competitivos').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('tier3').setLabel('🎯 Veteranos').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('tier4').setLabel('📈 Aspirantes').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('tier5').setLabel('🔰 En progreso').setStyle(ButtonStyle.Danger)
      );

      await canalTiers.send({ embeds: [embedTiers], components: [botonesTiers] });
    }

  } catch (error) {
    console.error('❌ Error enviando paneles:', error);
  }
});

// --------------------------
// INTERACCIONES BOTONES + MODALES
// --------------------------
const tierData = {
  tier1: { nombre: 'Profesionales', requisitos: 'Jugador RLCS', opciones: ['Player RLCS'], rolId: '1490563096610078862' },
  tier2: { nombre: 'Competitivos', requisitos: 'SSL → Grand Champion 3', opciones: ['SSL', 'Grand Champion 3'], rolId: '1490563098937921748' },
  tier3: { nombre: 'Veteranos', requisitos: 'Grand Champion 2 → Champion 3', opciones: ['Grand Champion 2', 'Grand Champion 1', 'Champion 3'], rolId: '1490563101479931964' },
  tier4: { nombre: 'Aspirantes', requisitos: 'Champion 2 → Diamond 3', opciones: ['Champion 2', 'Champion 1', 'Diamond 3'], rolId: '1490563105736884325' },
  tier5: { nombre: 'En progreso', requisitos: 'Diamond 2 → Bronze 1', opciones: ['Diamond 2','Diamond 1','Platino 3','Platino 2','Platino 1','Oro 3','Oro 2','Oro 1','Rangos inferiores'], rolId: '1490563136783126710' }
};

const fs = require('fs');
let warns = {};
try { warns = JSON.parse(fs.readFileSync('./warns.json', 'utf-8')); } catch { warns = {}; }

client.on('interactionCreate', async interaction => {
  if (interaction.isButton()) {
    // APPLYs
    if (interaction.customId === 'apply_button') {
      const modal = new ModalBuilder()
        .setCustomId('apply_modal')
        .setTitle('Formulario Tryout');

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('game_id').setLabel('ID de juego').setStyle(TextInputStyle.Short).setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('rango_actual').setLabel('Rango actual').setStyle(TextInputStyle.Short).setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('horas_jugadas').setLabel('Horas jugadas').setStyle(TextInputStyle.Short).setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('porque_unirse').setLabel('¿Por qué quieres unirte a NERV?').setStyle(TextInputStyle.Paragraph).setRequired(true)
        )
      );

      return interaction.showModal(modal);
    }

    // TIERS
    if (Object.keys(tierData).includes(interaction.customId)) {
      const tier = tierData[interaction.customId];
      const modal = new ModalBuilder()
        .setCustomId(`tier_modal_${interaction.customId}`)
        .setTitle(`Postulación ${tier.nombre}`);

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('rango')
            .setLabel(`En qué rango estás actualmente (verificaremos en Rocket Tracker)`)
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('game_id')
            .setLabel('ID de juego')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        )
      );

      return interaction.showModal(modal);
    }
  }

  // CAPTURAR MODALES
  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'apply_modal') {
      const gameId = interaction.fields.getTextInputValue('game_id');
      const rango = interaction.fields.getTextInputValue('rango_actual');
      const horas = interaction.fields.getTextInputValue('horas_jugadas');
      const porque = interaction.fields.getTextInputValue('porque_unirse');

      const embed = new EmbedBuilder()
        .setTitle(`🎯 Tryout de ${interaction.user.username}`)
        .setColor('#00FFFF')
        .setThumbnail('https://media.discordapp.net/attachments/1490445497318641670/1490476067981496481/nerv_logo.png')
        .setDescription(`**ID de juego:** ${gameId}\n**Rango actual:** ${rango}\n**Horas jugadas:** ${horas}\n**Por qué unirse:** ${porque}`);

      const canalTryouts = interaction.guild.channels.cache.get('1490462544798810173');
      await canalTryouts.send({ embeds: [embed] });
      await interaction.reply({ content: '✅ Tu formulario fue enviado correctamente!', ephemeral: true });
    }

    if (interaction.customId.startsWith('tier_modal_')) {
      const tierId = interaction.customId.replace('tier_modal_', '');
      const tier = tierData[tierId];
      const rango = interaction.fields.getTextInputValue('rango');
      const gameId = interaction.fields.getTextInputValue('game_id');

      const embed = new EmbedBuilder()
        .setTitle(`🎮 Postulación Tier ${tier.nombre}`)
        .setColor('#00FFFF')
        .setThumbnail('https://media.discordapp.net/attachments/1490445497318641670/1490476067981496481/nerv_logo.png')
        .setDescription(`**Usuario:** ${interaction.user.username}\n**Tier:** ${tier.nombre}\n**Rango actual:** ${rango}\n**ID de juego:** ${gameId}\nVerificaremos en Rocket Tracker que cumples con los requisitos.`);

      const canalTryouts = interaction.guild.channels.cache.get('1490462544798810173');
      await canalTryouts.send({ embeds: [embed] });

      // Asignar rol del tier
      const rolTier = interaction.guild.roles.cache.get(tier.rolId);
      if (rolTier) await interaction.member.roles.add(rolTier);

      await interaction.reply({ content: '✅ Tu postulación fue enviada correctamente!', ephemeral: true });
    }
  }
});

// --------------------------
// MODERACIÓN
// --------------------------
const staffLogChannelId = '1490581213159620659';
const mutedRoleId = '1490587338697609257';

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, options, member, guild } = interaction;

  // WARN
  if (commandName === 'warn') {
    const usuario = options.getUser('usuario');
    const razon = options.getString('razon') || 'No especificada';

    if (!warns[usuario.id]) warns[usuario.id] = [];
    warns[usuario.id].push({ razon, fecha: new Date().toISOString() });
    fs.writeFileSync('./warns.json', JSON.stringify(warns, null, 2));

    const embed = new EmbedBuilder()
      .setTitle('⚠️ Usuario Wardeado')
      .setColor('#FFA500')
      .addFields(
        { name: 'Usuario', value: `<@${usuario.id}>`, inline: true },
        { name: 'Moderador', value: `<@${member.id}>`, inline: true },
        { name: 'Razón', value: razon, inline: false },
        { name: 'Total Warns', value: `${warns[usuario.id].length}`, inline: true }
      )
      .setTimestamp();

    const logChannel = guild.channels.cache.get(staffLogChannelId);
    if (logChannel) await logChannel.send({ embeds: [embed] });

    await interaction.reply({ content: `✅ <@${usuario.id}> ha sido wardeado.`, ephemeral: true });
  }

  // MUTE
  if (commandName === 'mute') {
    const usuario = options.getMember('usuario');
    const razon = options.getString('razon') || 'No especificada';
    const tiempo = options.getInteger('tiempo') || 0;

    const rolMuted = guild.roles.cache.get(mutedRoleId);
    if (!rolMuted) return interaction.reply({ content: '❌ No se encontró el rol Muted.', ephemeral: true });

    await usuario.roles.add(rolMuted);

    const embed = new EmbedBuilder()
      .setTitle('🔇 Usuario Muted')
      .setColor('#FF0000')
      .addFields(
        { name: 'Usuario', value: `<@${usuario.id}>`, inline: true },
        { name: 'Moderador', value: `<@${member.id}>`, inline: true },
        { name: 'Razón', value: razon, inline: false },
        { name: 'Tiempo', value: `${tiempo} min`, inline: true }
      )
      .setTimestamp();

    const logChannel = guild.channels.cache.get(staffLogChannelId);
    if (logChannel) await logChannel.send({ embeds: [embed] });

    await interaction.reply({ content: `✅ <@${usuario.id}> ha sido muted.`, ephemeral: true });

    if (tiempo > 0) {
      setTimeout(async () => {
        if (usuario.roles.cache.has(rolMuted.id)) await usuario.roles.remove(rolMuted);
      }, tiempo * 60 * 1000);
    }
  }

  // UNMUTE
  if (commandName === 'unmute') {
    const usuario = options.getMember('usuario');
    const rolMuted = guild.roles.cache.get(mutedRoleId);
    if (!rolMuted) return interaction.reply({ content: '❌ No se encontró el rol Muted.', ephemeral: true });

    await usuario.roles.remove(rolMuted);
    await interaction.reply({ content: `✅ <@${usuario.id}> ha sido desmuted.`, ephemeral: true });
  }

  // BAN
  if (commandName === 'ban') {
    const usuario = options.getUser('usuario');
    const razon = options.getString('razon') || 'No especificada';
    await guild.members.ban(usuario, { reason: razon });
    await interaction.reply({ content: `✅ <@${usuario.id}> ha sido baneado.`, ephemeral: true });
  }

  // UNBAN
  if (commandName === 'unban') {
    const usuarioId = options.getString('usuario_id');
    await guild.members.unban(usuarioId);
    await interaction.reply({ content: `✅ Usuario con ID ${usuarioId} ha sido desbaneado.`, ephemeral: true });
  }
});

// --------------------------
// LOGIN BOT
// --------------------------
client.login(process.env.DISCORD_TOKEN);