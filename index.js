// --------------------------
// IMPORTS
// --------------------------
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
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// --------------------------
// VARIABLES DE ROLES / CANALES
// --------------------------
const MEMBER_ROLE_ID = '1490466327045869628';
const WELCOME_CHANNEL_ID = '1490483811664924883';
const TRYOUT_CATEGORY_ID = '1490462544798810173';
const APPLY_CHANNEL_ID = '1490462939361312941';
const BOT_ROLE_ID = '1490472100304257175';

// Staff roles
const STAFF_ROLES = {
  owner: '1490466019720822884',
  admin: '1490466026356342804',
  mod: '1490466028545769473',
  helper: '1490466913237602324'
};

// --------------------------
// BIENVENIDA + AUTO-ROL
// --------------------------
client.on('guildMemberAdd', async member => {
  try {
    const rolMiembro = member.guild.roles.cache.get(MEMBER_ROLE_ID);
    if (rolMiembro) await member.roles.add(rolMiembro);

    const canalBienvenida = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (canalBienvenida) {
      const embedBienvenida = new EmbedBuilder()
        .setTitle('🎉 ¡Bienvenido a NERV! ⚡')
        .setDescription(`¡Nos alegra tenerte en el servidor, ${member.user.username}! Revisa estos links importantes:`)
        .addFields(
          { name: 'Reglas', value: '[Haz clic aquí](https://tulink1.com)', inline: true },
          { name: 'Canales', value: '[Haz clic aquí](https://tulink2.com)', inline: true },
          { name: 'Roles', value: '[Haz clic aquí](https://tulink3.com)', inline: true }
        )
        .setColor('#8A2BE2')
        .setThumbnail('https://media.discordapp.net/attachments/1490445497318641670/1490476067981496481/nerv_logo.png')
        .setImage('https://media.discordapp.net/attachments/1490445497318641670/1490484413081845830/Gemini_Generated_Image_sqh3sisqh3sisqh3_1.png')
        .setFooter({ text: '⚡ ¡Compite, mejora y disfruta! - NERV' })
        .setTimestamp();

      await canalBienvenida.send({ embeds: [embedBienvenida] });
    }
  } catch (error) {
    console.error("❌ Error bienvenida:", error);
  }
});

// --------------------------
// PANEL DE TRYOUTS
// --------------------------
client.once('ready', async () => {
  console.log(`🔥 Bot listo como ${client.user.tag}`);

  try {
    const canalApplys = await client.channels.fetch(APPLY_CHANNEL_ID);
    const mensajes = await canalApplys.messages.fetch({ limit: 1 });

    if (mensajes.size === 0) {
      const botonRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('crear_ticket')
          .setLabel('Abrir Tryout')
          .setStyle(ButtonStyle.Danger)
      );

      await canalApplys.send({
        content: "🎟️ Presiona el botón para aplicar al tryout.",
        components: [botonRow]
      });
    }
  } catch (error) {
    console.error("❌ Error panel tryouts:", error);
  }
});

// --------------------------
// INTERACCIONES (BOTONES Y TICKETS)
// --------------------------
client.on('interactionCreate', async interaction => {
  if (interaction.isButton()) {
    // CREAR TICKET
    if (interaction.customId === 'crear_ticket') {
      await interaction.deferReply({ ephemeral: true });
      try {
        const nombre = interaction.user.username.replace(/[^a-zA-Z0-9]/g, "") || 'usuario';
        const categoria = interaction.guild.channels.cache.get(TRYOUT_CATEGORY_ID);

        const rolesParaVer = [
          STAFF_ROLES.owner,
          STAFF_ROLES.admin,
          STAFF_ROLES.mod
        ].map(id => interaction.guild.roles.cache.get(id))
          .filter(role => role)
          .map(role => ({ id: role.id, allow: [PermissionsBitField.Flags.ViewChannel] }));

        const permisoOverwrites = [
          { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel] },
          ...rolesParaVer,
          { id: BOT_ROLE_ID, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageChannels] }
        ];

        const ticket = await interaction.guild.channels.create({
          name: `tryout-${nombre}`,
          type: ChannelType.GuildText,
          parent: categoria.id,
          permissionOverwrites: permisoOverwrites
        });

        const embedTicket = new EmbedBuilder()
          .setTitle(`🎯 Tryout de ${interaction.user.username}`)
          .setDescription("Responde estas preguntas:\n- Rango actual\n- Plataforma\n- Horas jugadas\n- ¿Por qué quieres unirte a NERV?")
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
        console.error("❌ Error ticket:", error);
        await interaction.editReply({ content: `❌ Error creando el ticket: ${error.message}` });
      }
    }

    // CERRAR TICKET
    if (interaction.customId === 'cerrar_ticket') {
      await interaction.reply({ content: '🧹 Cerrando ticket...', ephemeral: true });
      setTimeout(() => {
        interaction.channel.delete().catch(console.error);
      }, 2000);
    }
  }

  // --------------------------
  // AQUÍ PODEMOS AGREGAR LOS COMANDOS SLASH (tiers, warn, mute, ping, etc.)
  // --------------------------
});

// --------------------------
// LOGIN
// --------------------------
client.login(process.env.DISCORD_TOKEN);