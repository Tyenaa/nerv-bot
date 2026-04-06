const { 
  Client, 
  GatewayIntentBits,
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
    GatewayIntentBits.GuildMembers
  ]
});

console.log("🚀 Iniciando NERV Bot...");

// ---------------- CONFIG ----------------
const CLIENT_ID = '1490451848442941480';
const GUILD_ID = '1490440780341448846';
const CATEGORY_ID = '1490462544798810173';
const CHANNEL_TIERS = '1490565371294650488';

// ---------------- TIERS ----------------
const tiers = [
  { id: 1, name: "Profesionales", emoji: "🏆", rango: "RLCS Player" },
  { id: 2, name: "Competitivos", emoji: "⚡", rango: "SSL a GC3" },
  { id: 3, name: "Veteranos", emoji: "🎯", rango: "GC2 a C3" },
  { id: 4, name: "Aspirantes", emoji: "📈", rango: "C2 a D3" },
  { id: 5, name: "En progreso", emoji: "🔰", rango: "D2 para abajo" }
];

// ---------------- READY ----------------
client.once('ready', async () => {
  console.log(`🔥 Bot listo como ${client.user.tag}`);

  // REGISTRAR COMANDOS
  const commands = [
    new SlashCommandBuilder()
      .setName('ping')
      .setDescription('Test del bot'),

    new SlashCommandBuilder()
      .setName('warn')
      .setDescription('Dar warn')
      .addUserOption(o=>o.setName('usuario').setRequired(true))
      .addStringOption(o=>o.setName('razon').setRequired(true))
  ].map(c=>c.toJSON());

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );

  console.log("✅ Comandos registrados");

  // PANEL TIERS (solo si no existe)
  const canal = await client.channels.fetch(CHANNEL_TIERS);
  const msgs = await canal.messages.fetch({ limit: 5 });

  if (msgs.size === 0) {
    const row = new ActionRowBuilder();

    tiers.forEach(t =>
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`tier_${t.id}`)
          .setLabel(`${t.emoji} ${t.name}`)
          .setStyle(ButtonStyle.Primary)
      )
    );

    const embed = new EmbedBuilder()
      .setTitle("Tiers NERV")
      .setDescription("Selecciona tu tier");

    await canal.send({ embeds: [embed], components: [row] });
  }
});

// ---------------- INTERACCIONES ----------------
client.on('interactionCreate', async interaction => {

  // SLASH COMMANDS
  if (interaction.isChatInputCommand()) {

    if (interaction.commandName === 'ping') {
      return interaction.reply("🏓 Pong");
    }

    if (interaction.commandName === 'warn') {
      const user = interaction.options.getUser('usuario');
      const razon = interaction.options.getString('razon');

      return interaction.reply(`⚠️ ${user.tag} advertido: ${razon}`);
    }
  }

  // BOTONES
  if (interaction.isButton()) {

    // TIERS
    if (interaction.customId.startsWith('tier_')) {
      await interaction.deferReply({ ephemeral: true });

      const tierId = parseInt(interaction.customId.split('_')[1]);
      const tier = tiers.find(t => t.id === tierId);

      const nombre = interaction.user.username.replace(/[^a-zA-Z0-9]/g, "");

      const ticket = await interaction.guild.channels.create({
        name: `tier-${nombre}`,
        type: ChannelType.GuildText,
        parent: CATEGORY_ID,
        permissionOverwrites: [
          { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel] }
        ]
      });

      const embed = new EmbedBuilder()
        .setTitle(`Postulación ${tier.name}`)
        .setDescription(`Rango requerido: ${tier.rango}`);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('cerrar')
          .setLabel('Cerrar')
          .setStyle(ButtonStyle.Danger)
      );

      await ticket.send({ embeds: [embed], components: [row] });

      return interaction.editReply(`✅ Ticket creado: ${ticket}`);
    }

    // CERRAR
    if (interaction.customId === 'cerrar') {
      await interaction.reply({ content: "Cerrando...", ephemeral: true });
      setTimeout(() => interaction.channel.delete(), 2000);
    }
  }
});

// ---------------- LOGIN ----------------
client.login(process.env.DISCORD_TOKEN);