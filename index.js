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

const express = require('express'); // Para UptimeRobot
const app = express();
const PORT = process.env.PORT || 3000;

// --------------------------
// SERVIDOR WEB PARA UPTIMEROOT
// --------------------------
app.get('/', (req, res) => res.send('✅ NERV Bot Online!'));
app.listen(PORT, () => console.log(`🌐 Servidor web corriendo en puerto ${PORT}`));

// --------------------------
// CLIENTE DE DISCORD
// --------------------------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
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
// PANEL DE TIERS
// --------------------------
client.once('ready', async () => {
  console.log(`🔥 Bot listo como ${client.user.tag}`);

  try {
    const canalTiers = await client.channels.fetch('1490565371294650488'); // Canal Tiers
    const mensajesTiers = await canalTiers.messages.fetch({ limit: 5 });

    const embedTiers = new EmbedBuilder()
      .setTitle('🎮 Tiers - NERV Esports')
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
// SISTEMA DE TICKETS POR TIER
// --------------------------
const tierRoles = {
  postular_t1: { id: '1490563096610078862', name: 'Profesionales', emoji: '🏆', requisitos: 'Jugador RLCS' },
  postular_t2: { id: '1490563098937921748', name: 'Competitivos', emoji: '⚡', requisitos: 'SSL → Grand Champion 3' },
  postular_t3: { id: '1490563101479931964', name: 'Veteranos', emoji: '🎯', requisitos: 'Grand Champion 2 → Champion 3' },
  postular_t4: { id: '1490563105736884325', name: 'Aspirantes', emoji: '📈', requisitos: 'Champion 2 → Diamond 3' },
  postular_t5: { id: '1490563136783126710', name: 'En progreso', emoji: '🔰', requisitos: 'Diamond 2 → Bronze 1' }
};

client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  if (Object.keys(tierRoles).includes(interaction.customId)) {
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

      // Asignar rol del Tier
      const rolTier = interaction.guild.roles.cache.get(tier.id);
      if (rolTier) await interaction.member.roles.add(rolTier);

      const embedTicket = new EmbedBuilder()
        .setTitle(`🎮 Postulación para Tiers`)
        .setDescription(`¡Estás por postularte al **${tier.name} ${tier.emoji}**!\n\n**Requisitos:** ${tier.requisitos}\n**Rango actual:** Indica tu rango actual\n**Prueba:** Envía evidencia de tu nivel actual para esta temporada\n**ID del juego:** Tu ID para verificación`)
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

  if (interaction.customId === 'cerrar_ticket') {
    await interaction.reply({ content: '🧹 Cerrando ticket...', ephemeral: true });
    setTimeout(() => {
      interaction.channel.delete().catch(console.error);
    }, 2000);
  }
});

// --------------------------
// LOGIN BOT
// --------------------------
client.login(process.env.DISCORD_TOKEN);