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
  SlashCommandBuilder
} = require('discord.js');

require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const SERVER_ID = '1490440780341448846';
const WELCOME_CHANNEL = '1490483811664924883';
const RULES_CHANNEL = '1490450067860230235';
const TIERS_CHANNEL = '1490565371294650488';
const STAFF_CHANNEL = '1490581213159620659';
const MEMBER_ROLE = '1490466327045869628';

// Roles de staff
const STAFF_ROLES = {
  owner: '1490466019720822884',
  admin: '1490466026356342804',
  mod: '1490466028545769473',
  helper: '1490466913237602324'
};

// Tiers
const TIERS = [
  { id: '1490563096610078862', name: 'Tier 1 🏆 - Profesionales', range: 'Jugador RLCS' },
  { id: '1490563098937921748', name: 'Tier 2 ⚡ - Competitivos', range: 'SSL → Grand Champion 3' },
  { id: '1490563101479931964', name: 'Tier 3 🎯 - Veteranos', range: 'Grand Champion 2 → Champion 3' },
  { id: '1490563105736884325', name: 'Tier 4 📈 - Aspirantes', range: 'Champion 2 → Diamond 3' },
  { id: '1490563136783126710', name: 'Tier 5 🔰 - En progreso', range: 'Diamond 2 → Bronze 1' }
];

console.log("🚀 Iniciando NERV Bot...");

// --------------------------
// AUTO-ROL MIEMBRO + BIENVENIDA
// --------------------------
client.on('guildMemberAdd', async member => {
  try {
    // Dar rol Miembro
    const rolMiembro = member.guild.roles.cache.get(MEMBER_ROLE); 
    if (rolMiembro) await member.roles.add(rolMiembro);
    console.log(`✅ Se dio rol Miembro a ${member.user.tag}`);

    // Embed de bienvenida
    const canalBienvenida = member.guild.channels.cache.get(WELCOME_CHANNEL);
    if (canalBienvenida) {
      const embedBienvenida = new EmbedBuilder()
        .setTitle('🎉 ¡Bienvenido a NERV! ⚡')
        .setDescription(`¡Nos alegra tenerte en el servidor, ${member.user.username}! Aquí podrás mejorar, competir y formar parte de la comunidad NERV.\n\n🔹 Lee las reglas en <#${RULES_CHANNEL}>\n🔹 Conoce los tiers en <#${TIERS_CHANNEL}>`)
        .setImage('https://media.discordapp.net/attachments/1490445497318641670/1490484413081845830/Gemini_Generated_Image_sqh3sisqh3sisqh3_1.png?ex=69d43947&is=69d2e7c7&hm=c0d46c37ad38bb19cc99d9972c8b47deb788bd8dbb29fbb77658571bb6fa0da2&=&format=webp&quality=lossless')
        .setThumbnail('https://media.discordapp.net/attachments/1490445497318641670/1490476067981496481/nerv_logo.png?ex=69d43182&is=69d2e002&hm=2c28f71feee732baa6e0da74790e5da8c0379bb69c7ef95dc92e604121285d39&=&format=webp&quality=lossless')
        .setColor('#8A2BE2')
        .setFooter({ text: '⚡ ¡Compite, mejora y disfruta! - NERV' });

      await canalBienvenida.send({ embeds: [embedBienvenida] });
    }

  } catch (error) {
    console.error("❌ Error al asignar rol o enviar bienvenida:", error);
  }
});

// --------------------------
// PANEL TRYOUTS Y TIERS
// --------------------------
client.once('ready', async () => {
  console.log(`🔥 Bot listo como ${client.user.tag}`);

  try {
    const canalApplys = await client.channels.fetch('1490462939361312941'); // Canal Applys
    const mensajes = await canalApplys.messages.fetch({ limit: 1 });

    if (mensajes.size === 0) {
      // Botón Tryout
      const botonRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('crear_ticket_tryout')
          .setLabel('Abrir Tryout')
          .setStyle(ButtonStyle.Danger)
      );

      // Botones Tiers
      const botonTiers = new ActionRowBuilder();
      TIERS.forEach((tier, i) => {
        botonTiers.addComponents(
          new ButtonBuilder()
            .setCustomId(`tier_${i+1}`)
            .setLabel(tier.name)
            .setStyle(ButtonStyle.Primary)
        );
      });

      await canalApplys.send({
        content: "🎟️ Presiona el botón para aplicar al tryout o seleccionar tu tier.",
        components: [botonRow, botonTiers]
      });
    }
  } catch (error) {
    console.error("❌ Error panel:", error);
  }
});

// --------------------------
// INTERACCIONES (Tickets y Tiers)
// --------------------------
client.on('interactionCreate', async interaction => {
  if (!interaction.isButton() && !interaction.isChatInputCommand()) return;

  // ------------------
  // Ping
  // ------------------
  if (interaction.isChatInputCommand() && interaction.commandName === 'ping') {
    await interaction.reply({ content: '🏓 Pong!', ephemeral: true });
  }

  // ------------------
  // TICKETS TRYOUT / TIER
  // ------------------
  if (interaction.isButton()) {
    await interaction.deferReply({ ephemeral: true });

    let nombre = interaction.user.username.replace(/[^a-zA-Z0-9]/g, "") || 'usuario';
    let categoria, embedTitle, embedDesc;

    if (interaction.customId === 'crear_ticket_tryout') {
      categoria = interaction.guild.channels.cache.get('1490462544798810173');
      embedTitle = `🎯 Tryout de ${interaction.user.username}`;
      embedDesc = "Responde las siguientes preguntas dentro de este ticket:\n- Rango actual\n- Plataforma\n- Horas jugadas\n- ¿Por qué quieres unirte a NERV?";
    }

    // Tiers
    const tierMatch = interaction.customId.match(/^tier_(\d)$/);
    if (tierMatch) {
      const index = parseInt(tierMatch[1]) - 1;
      const tier = TIERS[index];
      categoria = interaction.guild.channels.cache.get('1490462544798810173'); // misma categoría de tickets
      embedTitle = `🏆 Solicitud ${tier.name} de ${interaction.user.username}`;
      embedDesc = `Requisitos:\n- ${tier.range}\n\nResponde en este ticket tu información y evidencia de rango.`;
    }

    if (categoria) {
      try {
        const botPerm = categoria.permissionsFor(interaction.guild.members.me);
        if (!botPerm.has(PermissionsBitField.Flags.ManageChannels)) {
          throw new Error("El bot no tiene permiso para crear canales en la categoría.");
        }

        // Roles staff que verán el ticket
        const rolesParaVer = [
          STAFF_ROLES.owner,
          STAFF_ROLES.admin,
          STAFF_ROLES.mod,
          STAFF_ROLES.helper
        ].map(id => interaction.guild.roles.cache.get(id))
          .filter(role => role)
          .map(role => ({ id: role.id, allow: [PermissionsBitField.Flags.ViewChannel] }));

        const permisoOverwrites = [
          { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] }, // @everyone
          { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel] }, // usuario
          ...rolesParaVer,
          { id: '1490472100304257175', allow: [ // ROL DEL BOT
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ManageChannels
          ] }
        ];

        const ticket = await interaction.guild.channels.create({
          name: `${tierMatch ? `tier-${nombre}` : `tryout-${nombre}`}`,
          type: ChannelType.GuildText,
          parent: categoria.id,
          permissionOverwrites: permisoOverwrites
        });

        const embedTicket = new EmbedBuilder()
          .setTitle(embedTitle)
          .setDescription(embedDesc)
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
        console.error("❌ ERROR CREANDO TICKET:", error);
        await interaction.editReply({ content: `❌ Error creando el ticket: ${error.message}` });
      }
    }

    // ------------------
    // CERRAR TICKET
    // ------------------
    if (interaction.customId === 'cerrar_ticket') {
      await interaction.reply({ content: '🧹 Cerrando ticket...', ephemeral: true });
      setTimeout(() => {
        interaction.channel.delete().catch(console.error);
      }, 2000);
    }
  }

  // ------------------
  // Aquí agregar moderación después (warn, mute, unmute, ban, unban)
  // ------------------
});

// --------------------------
// LOGIN BOT
// --------------------------
client.login(DISCORD_TOKEN);