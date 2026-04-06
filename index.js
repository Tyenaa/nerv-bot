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

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

console.log("🚀 Iniciando NERV Bot...");

// --------------------------
// VARIABLES DE TIER
// --------------------------
const tiers = [
  { id: 1, name: "Profesionales", emoji: "🏆", color: "#FF0000", rango: "RLCS Player - Top 2 SSL" , roleId:'1490563096610078862' },
  { id: 2, name: "Competitivos", emoji: "⚡", color: "#FF8C00", rango: "SSL a Gran Champion 3", roleId:'1490563098937921748' },
  { id: 3, name: "Veteranos", emoji: "🎯", color: "#FFD700", rango: "Gran Champion 2 a Champion 3", roleId:'1490563101479931964' },
  { id: 4, name: "Aspirantes", emoji: "📈", color: "#00FF00", rango: "Champion 2 a Diamante 3", roleId:'1490563105736884325' },
  { id: 5, name: "En progreso", emoji: "🔰", color: "#00FFFF", rango: "Diamante 2 para abajo", roleId:'1490563136783126710' }
];

// --------------------------
// BIENVENIDA
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
  } catch (err) {
    console.error(err);
  }
});

// --------------------------
// PANEL TRYOUTS / TIERS
// --------------------------
client.once('ready', async () => {
  console.log(`🔥 Bot listo como ${client.user.tag}`);

  try {
    const canalApplys = await client.channels.fetch('1490565371294650488'); // Canal Tiers
    const mensajes = await canalApplys.messages.fetch({ limit: 1 });

    if (mensajes.size === 0) {
      const row = new ActionRowBuilder();
      tiers.forEach(tier => {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`tier_${tier.id}`)
            .setLabel(`${tier.emoji} ${tier.name}`)
            .setStyle(ButtonStyle.Primary)
        );
      });

      const embed = new EmbedBuilder()
        .setTitle("🎮 Postúlate a tu Tier")
        .setDescription("Selecciona tu Tier y abre un ticket para postularte.\nTe pediremos tu rango actual y tu ID del juego para verificar.")
        .setColor("#FF00FF");

      await canalApplys.send({ embeds: [embed], components: [row] });
    }

  } catch (err) {
    console.error(err);
  }
});

// --------------------------
// SISTEMA DE TICKETS POR TIER
// --------------------------
client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  // BOTONES DE TIERS
  if (interaction.customId.startsWith('tier_')) {
    await interaction.deferReply({ ephemeral: true });

    const tierId = parseInt(interaction.customId.split('_')[1]);
    const tier = tiers.find(t => t.id === tierId);
    if (!tier) return;

    const categoria = interaction.guild.channels.cache.get('1490462544798810173'); // Categoría Tryouts
    if (!categoria) return;

    const nombre = interaction.user.username.replace(/[^a-zA-Z0-9]/g, "") || 'usuario';

    const permisoOverwrites = [
      { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
      { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
      { id: '1490472100304257175', allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] } // ROL BOT
    ];

    const ticket = await interaction.guild.channels.create({
      name: `tier-${nombre}`,
      type: ChannelType.GuildText,
      parent: categoria.id,
      permissionOverwrites: permisoOverwrites
    });

    const embedTicket = new EmbedBuilder()
      .setTitle(`📌 Postulación para Tiers`)
      .setDescription(`Estas por postularte al **Tier ${tier.id} - ${tier.name}**\n\n**Requisitos:** ${tier.rango}\n\n- Escribe en este canal tu rango actual\n- Envía una prueba de tu rango esta temporada\n- Comparte tu ID del juego`)
      .setColor(tier.color);

    const cerrarRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('cerrar_ticket')
        .setLabel('❌ Cerrar Ticket')
        .setStyle(ButtonStyle.Danger)
    );

    await ticket.send({ embeds: [embedTicket], components: [cerrarRow] });
    await interaction.editReply({ content: `✅ Ticket creado: ${ticket}` });
  }

  // CERRAR TICKET
  if (interaction.customId === 'cerrar_ticket') {
    await interaction.reply({ content: '🧹 Cerrando ticket...', ephemeral: true });
    setTimeout(() => {
      interaction.channel.delete().catch(console.error);
    }, 2000);
  }
});

// --------------------------
// SISTEMA DE MODERACIÓN
// --------------------------
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');

const commands = [
  new SlashCommandBuilder().setName('warn').setDescription('Dar un warn').addUserOption(opt=>opt.setName('usuario').setDescription('Usuario a advertir').setRequired(true)).addStringOption(opt=>opt.setName('razon').setDescription('Razón').setRequired(true)),
  new SlashCommandBuilder().setName('mute').setDescription('Mutear usuario').addUserOption(opt=>opt.setName('usuario').setDescription('Usuario a mutear').setRequired(true)).addStringOption(opt=>opt.setName('tiempo').setDescription('Tiempo en minutos').setRequired(true)),
  new SlashCommandBuilder().setName('ban').setDescription('Banear usuario').addUserOption(opt=>opt.setName('usuario').setDescription('Usuario a banear').setRequired(true)).addStringOption(opt=>opt.setName('razon').setDescription('Razón').setRequired(true))
].map(c=>c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
(async ()=>{ await rest.put(Routes.applicationCommands('1490451848442941480'), { body: commands }); })();

// --------------------------
// LOGIN BOT
// --------------------------
client.login(process.env.DISCORD_TOKEN);