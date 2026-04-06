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
  SlashCommandBuilder,
  REST,
  Routes
} = require('discord.js');
const express = require('express'); // Para mantener el bot activo en Railway
const app = express();

// -------------------- SERVIDOR WEB PARA UPTIME --------------------
app.get("/", (req, res) => res.send("Servidor NERV Bot activo"));
app.listen(8080, () => console.log("🌐 Servidor web corriendo en puerto 8080"));

// -------------------- CLIENTE DISCORD --------------------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

const SERVER_ID = '1490440780341448846';
const LOG_CHANNEL = '1490581213159620659';
const TICKET_CATEGORY = '1490462544798810173';

// Roles de staff
const ROLES_STAFF = {
  helper: '1490466913237602324',
  mod: '1490466028545769473',
  admin: '1490466026356342804',
  owner: '1490466019720822884'
};

// Roles Tiers
const TIERS = [
  { id: '1490563096610078862', nombre: 'Profesionales', rango: 'RLCS / Top 2 SSL-GrandChampion 3', emoji: '🏆' },
  { id: '1490563098937921748', nombre: 'Competitivos', rango: 'SSL a GrandChampion 3', emoji: '⚡' },
  { id: '1490563101479931964', nombre: 'Veteranos', rango: 'GrandChampion 2 a Champion 3', emoji: '🎯' },
  { id: '1490563105736884325', nombre: 'Aspirantes', rango: 'Champion 2 a Diamond 3', emoji: '📈' },
  { id: '1490563136783126710', nombre: 'En progreso', rango: 'Diamond 2 para abajo', emoji: '🔰' },
];

// -------------------- BIENVENIDA --------------------
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
      await canalBienvenida.send({ embeds: [embed] });
    }
  } catch(e) {
    console.error('Error en bienvenida:', e);
  }
});

// -------------------- PANEL TIER / TRYOUTS --------------------
client.once('ready', async () => {
  console.log(`🔥 Bot listo como ${client.user.tag}`);

  try {
    const canalTiers = await client.channels.fetch('1490565371294650488');

    // Mensaje Embed con los Tiers
    const embed = new EmbedBuilder()
      .setTitle('🎮 Postúlate a tu Tier')
      .setDescription('Selecciona tu Tier para abrir un ticket de postulación. Lee los requisitos antes de postularte.')
      .setColor('#8A2BE2');

    TIERS.forEach(t => {
      embed.addFields({ name: `${t.emoji} ${t.nombre}`, value: t.rango, inline: false });
    });

    const row = new ActionRowBuilder().addComponents(
      TIERS.map(t => new ButtonBuilder()
        .setCustomId(`tier_${t.id}`)
        .setLabel(t.nombre)
        .setStyle(ButtonStyle.Primary)
      )
    );

    await canalTiers.send({ embeds: [embed], components: [row] });
  } catch(e) {
    console.error('Error creando embed de Tiers:', e);
  }
});

// -------------------- CREAR TICKETS DE TIERS --------------------
client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  // Ticket por Tier
  if (interaction.customId.startsWith('tier_')) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const tierId = interaction.customId.replace('tier_', '');
      const tierData = TIERS.find(t => t.id === tierId);

      if (!tierData) return interaction.editReply({ content: '❌ Tier no encontrado.' });

      const nombre = interaction.user.username.replace(/[^a-zA-Z0-9]/g, "") || 'usuario';

      const permisoOverwrites = [
        { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel] },
        ...Object.values(ROLES_STAFF).map(rid => ({
          id: rid,
          allow: [PermissionsBitField.Flags.ViewChannel]
        })),
        { id: client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageChannels] }
      ];

      const ticket = await interaction.guild.channels.create({
        name: `tier-${nombre}`,
        type: ChannelType.GuildText,
        parent: TICKET_CATEGORY,
        permissionOverwrites: permisoOverwrites
      });

      const embedTicket = new EmbedBuilder()
        .setTitle(`📋 Postulación para ${tierData.nombre}`)
        .setDescription(`Estas por postularte a **${tierData.nombre}**\nRequisitos: ${tierData.rango}\n\n**Rango actual:**\n**Prueba de temporada:**\n**ID del juego:**`)
        .setColor('#00FFFF')
        .setFooter({ text: '⚡ NERV - Compite, mejora y disfruta!' });

      const cerrarRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('cerrar_ticket')
          .setLabel('❌ Cerrar Ticket')
          .setStyle(ButtonStyle.Danger)
      );

      await ticket.send({ embeds: [embedTicket], components: [cerrarRow] });
      await interaction.editReply({ content: `✅ Ticket creado: ${ticket}` });
    } catch(e) {
      console.error('Error creando ticket Tier:', e);
      await interaction.editReply({ content: `❌ Error: ${e.message}` });
    }
  }

  // Cerrar ticket
  if (interaction.customId === 'cerrar_ticket') {
    await interaction.reply({ content: '🧹 Cerrando ticket...', ephemeral: true });
    setTimeout(() => interaction.channel.delete().catch(console.error), 2000);
  }
});

// -------------------- COMANDOS DE MODERACION --------------------
const { Collection } = require('discord.js');
client.commands = new Collection();

const commands = [
  new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Dar un warn a un usuario')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a sancionar').setRequired(true))
    .addStringOption(opt => opt.setName('razon').setDescription('Razón del warn').setRequired(true)),
  new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Silenciar a un usuario')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a silenciar').setRequired(true))
    .addIntegerOption(opt => opt.setName('tiempo').setDescription('Tiempo en minutos')),
  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Banea a un usuario')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a banear').setRequired(true))
    .addStringOption(opt => opt.setName('razon').setDescription('Razón del ban').setRequired(true))
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
(async () => {
  try {
    console.log('🚀 Registrando comandos de moderación...');
    await rest.put(
      Routes.applicationGuildCommands('1490451848442941480', SERVER_ID),
      { body: commands }
    );
    console.log('✅ Comandos registrados');
  } catch(e) {
    console.error(e);
  }
})();

// -------------------- LOGIN --------------------
client.login(process.env.DISCORD_TOKEN);