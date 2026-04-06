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
  REST, 
  Routes, 
  SlashCommandBuilder
} = require('discord.js');
require('dotenv').config();

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = '1490451848442941480';
const GUILD_ID = '1490440780341448846';

// --------------------------
// CONFIG DE CANALES Y ROLES
// --------------------------
const IDs = {
  rolMiembro: '1490466327045869628',
  canalBienvenida: '1490483811664924883',
  canalReglas: '1490450067860230235',
  canalTiers: '1490565371294650488',
  categoriaTryouts: '1490462544798810173',
  rolesStaff: {
    owner: '1490466019720822884',
    admin: '1490466026356342804',
    mod: '1490466028545769473',
    helper: '1490466913237602324'
  },
  rolBot: '1490472100304257175',
  rolesTiers: {
    tier1: 'ID_TIER1',
    tier2: 'ID_TIER2',
    tier3: 'ID_TIER3'
  }
};

// --------------------------
// CLIENTE
// --------------------------
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  partials: [Partials.Channel]
});

console.log("🚀 Iniciando NERV Bot...");

// --------------------------
// AUTO-ROL MIEMBRO + BIENVENIDA
// --------------------------
client.on('guildMemberAdd', async member => {
  try {
    // Dar rol Miembro
    const rolMiembro = member.guild.roles.cache.get(IDs.rolMiembro); 
    if (rolMiembro) await member.roles.add(rolMiembro);

    // Embed de bienvenida con banner
    const canalBienvenida = member.guild.channels.cache.get(IDs.canalBienvenida);
    if (canalBienvenida) {
      const embedBienvenida = new EmbedBuilder()
        .setTitle('🎉 ¡Bienvenido a NERV! ⚡')
        .setDescription(`¡Nos alegra tenerte en el servidor, ${member.user.username}! Lee las reglas y consulta los tiers:`)
        .addFields(
          { name: '📜 Reglas', value: `<#${IDs.canalReglas}>`, inline: true },
          { name: '🌟 Tiers', value: `<#${IDs.canalTiers}>`, inline: true }
        )
        .setImage('URL_DEL_BANNER_AQUI') // <- Aquí tu banner
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
// PANEL TRYOUTS
// --------------------------
client.once('ready', async () => {
  console.log(`🔥 Bot listo como ${client.user.tag}`);

  try {
    // Panel Tryouts
    const canalApplys = await client.channels.fetch('1490462939361312941');
    const mensajes = await canalApplys.messages.fetch({ limit: 1 });
    if (mensajes.size === 0) {
      const botonRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('crear_ticket').setLabel('Abrir Tryout').setStyle(ButtonStyle.Danger)
      );
      await canalApplys.send({ content: "🎟️ Presiona el botón para aplicar al tryout.", components: [botonRow] });
    }

    // Panel Tiers
    const canalTiers = await client.channels.fetch(IDs.canalTiers);
    const mensajesTiers = await canalTiers.messages.fetch({ limit: 1 });
    if (mensajesTiers.size === 0) {
      const tiersRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder().setCustomId('tier1').setLabel('Tier 1').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('tier2').setLabel('Tier 2').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('tier3').setLabel('Tier 3').setStyle(ButtonStyle.Primary)
        );
      await canalTiers.send({ content: '🌟 Escoge tu tier:', components: [tiersRow] });
    }

  } catch (error) {
    console.error("❌ Error panel:", error);
  }
});

// --------------------------
// INTERACCIONES BOTONES / SLASH
// --------------------------
client.on('interactionCreate', async interaction => {
  if (interaction.isButton()) {
    // ----- CREAR TICKET -----
    if (interaction.customId === 'crear_ticket') {
      await interaction.deferReply({ ephemeral: true });

      try {
        const nombre = interaction.user.username.replace(/[^a-zA-Z0-9]/g, "") || 'usuario';
        const categoria = interaction.guild.channels.cache.get(IDs.categoriaTryouts);
        if (!categoria) throw new Error("Categoría de tickets no encontrada.");

        const botPerm = categoria.permissionsFor(interaction.guild.members.me);
        if (!botPerm.has(PermissionsBitField.Flags.ManageChannels)) throw new Error("Bot sin permisos.");

        const rolesParaVer = [IDs.rolesStaff.owner, IDs.rolesStaff.admin, IDs.rolesStaff.mod]
          .map(id => interaction.guild.roles.cache.get(id))
          .filter(r => r)
          .map(role => ({ id: role.id, allow: [PermissionsBitField.Flags.ViewChannel] }));

        const permisoOverwrites = [
          { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel] },
          ...rolesParaVer,
          { id: IDs.rolBot, allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ManageChannels
          ]}
        ];

        const ticket = await interaction.guild.channels.create({
          name: `tryout-${nombre}`,
          type: ChannelType.GuildText,
          parent: categoria.id,
          permissionOverwrites: permisoOverwrites
        });

        const embedTicket = new EmbedBuilder()
          .setTitle(`🎯 Tryout de ${interaction.user.username}`)
          .setDescription("Responde las preguntas dentro de este ticket:\n- Rango actual\n- Plataforma\n- Horas jugadas\n- ¿Por qué quieres unirte a NERV?")
          .setColor('#00FFFF')
          .setThumbnail('https://media.discordapp.net/attachments/1490445497318641670/1490476067981496481/nerv_logo.png')
          .setFooter({ text: '⚡ NERV - Compite, mejora y disfruta!' });

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

    // ----- CERRAR TICKET -----
    if (interaction.customId === 'cerrar_ticket') {
      await interaction.reply({ content: '🧹 Cerrando ticket...', ephemeral: true });
      setTimeout(() => interaction.channel.delete().catch(console.error), 2000);
    }

    // ----- BOTONES TIERS -----
    if (['tier1','tier2','tier3'].includes(interaction.customId)) {
      const rolId = IDs.rolesTiers[interaction.customId];
      if (!rolId) return;

      const rol = interaction.guild.roles.cache.get(rolId);
      if (!rol) return;

      if (interaction.member.roles.cache.has(rol.id)) {
        await interaction.member.roles.remove(rol);
        await interaction.reply({ content: `❌ Se te quitó el rol ${rol.name}`, ephemeral: true });
      } else {
        await interaction.member.roles.add(rol);
        await interaction.reply({ content: `✅ Se te asignó el rol ${rol.name}`, ephemeral: true });
      }
    }
  }

  // ----- SLASH COMMANDS -----
  if (interaction.isChatInputCommand()) {
    const { commandName } = interaction;
    if (commandName === 'ping') await interaction.reply({ content: '🏓 Pong!', ephemeral: true });
    // /mute, /warn, /ban deben registrarse aparte
  }
});

// --------------------------
// REGISTRAR COMANDOS SLASH
// --------------------------
const commands = [
  new SlashCommandBuilder().setName('ping').setDescription('Comprueba si el bot está online')
];

const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
  try {
    console.log('⚙ Registrando comandos slash...');
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log('✅ Comandos slash registrados');
  } catch (error) {
    console.error(error);
  }
})();

// --------------------------
// LOGIN BOT
// --------------------------
client.login(TOKEN);