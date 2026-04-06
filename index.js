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
    // Dar rol Miembro
    const rolMiembro = member.guild.roles.cache.get('1490466327045869628'); 
    if (rolMiembro) await member.roles.add(rolMiembro);
    console.log(`✅ Se dio rol Miembro a ${member.user.tag}`);

    // Embed de bienvenida
    const canalBienvenida = member.guild.channels.cache.get('1490483811664924883');
    if (canalBienvenida) {
      const embedBienvenida = new EmbedBuilder()
        .setTitle('🎉 ¡Bienvenido a NERV! ⚡')
        .setDescription(`¡Nos alegra tenerte en el servidor, ${member.user.username}! Aquí podrás mejorar, competir y formar parte de la comunidad NERV.`)
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
// PANEL TRYOUTS + EMBED DE TIERS
// --------------------------
client.once('ready', async () => {
  console.log(`🔥 Bot listo como ${client.user.tag}`);

  // --- CANAL DE APPLYs ---
  try {
    const canalApplys = await client.channels.fetch('1490462939361312941'); // Canal Applys
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
    console.error("❌ Error panel Applys:", error);
  }

  // --- CANAL DE TIERS ---
  try {
    const canalTiers = await client.channels.fetch('1490565371294650488'); // Canal Tiers

    const embedTiers = new EmbedBuilder()
      .setTitle('🎮 Tiers - Nerv Esports')
      .setDescription('Aquí puedes ver los niveles competitivos de NERV y los rangos que entran en cada tier. Presiona el botón de tu tier para postularte y abrir un ticket.')
      .addFields(
        { name: 'Tier 1 - Profesionales', value: 'Rango: Jugador RLCS', inline: false },
        { name: 'Tier 2 - Competitivos', value: 'Rango: SSL → Grand Champion 3', inline: false },
        { name: 'Tier 3 - Veteranos', value: 'Rango: Grand Champion 2 → Champion 3', inline: false },
        { name: 'Tier 4 - Aspirantes', value: 'Rango: Champion 2 → Diamond 3', inline: false },
        { name: 'Tier 5 - En progreso', value: 'Rango: Diamond 2 → abajo', inline: false }
      )
      .setColor('#E10600')
      .setThumbnail('https://media.discordapp.net/attachments/1490445497318641670/1490476067981496481/nerv_logo.png')
      .setFooter({ text: '⚡ Nerv Esports - Compite, mejora y disfruta!' });

    const botonesTiers = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('postular_t1').setLabel('🟥 Profesionales').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('postular_t2').setLabel('🔥 Competitivos').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('postular_t3').setLabel('🛡️ Veteranos').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('postular_t4').setLabel('⬜ Aspirantes').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('postular_t5').setLabel('⚫ En progreso').setStyle(ButtonStyle.Danger)
    );

    const mensajesTiers = await canalTiers.messages.fetch({ limit: 5 });
    if (mensajesTiers.size === 0) {
      await canalTiers.send({ embeds: [embedTiers], components: [botonesTiers] });
      console.log('✅ Embed de Tiers enviado.');
    }
  } catch (error) {
    console.error('❌ Error enviando embed de Tiers:', error);
  }
});

// --------------------------
// SISTEMA DE TICKETS CON EMBED POR TIER
// --------------------------
const tierRoles = {
  postular_t1: '1490563096610078862', // Profesionales
  postular_t2: '1490563098937921748', // Competitivos
  postular_t3: '1490563101479931964', // Veteranos
  postular_t4: '1490563105736884325', // Aspirantes
  postular_t5: '1490563136783126710'  // En progreso
};

client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  // CREAR TICKET POR TIER
  if (Object.keys(tierRoles).includes(interaction.customId) || interaction.customId === 'crear_ticket') {
    await interaction.deferReply({ ephemeral: true });

    try {
      const tierRolId = tierRoles[interaction.customId]; // undefined si es boton general "crear_ticket"
      const nombre = interaction.user.username.replace(/[^a-zA-Z0-9]/g, "") || 'usuario';
      const categoria = interaction.guild.channels.cache.get('1490462544798810173'); // Categoría Tryouts
      if (!categoria) throw new Error("Categoría de tickets no encontrada.");

      const botPerm = categoria.permissionsFor(interaction.guild.members.me);
      if (!botPerm.has(PermissionsBitField.Flags.ManageChannels)) {
        throw new Error("El bot no tiene permiso para crear canales en la categoría.");
      }

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
        name: `tryout-${nombre}`,
        type: ChannelType.GuildText,
        parent: categoria.id,
        permissionOverwrites: permisoOverwrites
      });

      // Asignar rol del Tier si corresponde
      if (tierRolId) {
        const rolTier = interaction.guild.roles.cache.get(tierRolId);
        if (rolTier) await interaction.member.roles.add(rolTier);
      }

      const embedTicket = new EmbedBuilder()
        .setTitle(`🎯 Tryout de ${interaction.user.username}`)
        .setDescription(tierRolId
          ? `Has abierto un ticket para postularte a **${interaction.guild.roles.cache.get(tierRolId).name}**.\nResponde aquí tus datos:\n- Rango actual\n- Plataforma\n- Horas jugadas\n- ¿Por qué quieres unirte a NERV?`
          : "Responde las siguientes preguntas dentro de este ticket:\n- Rango actual\n- Plataforma\n- Horas jugadas\n- ¿Por qué quieres unirte a NERV?")
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
      console.error("❌ Error creando ticket:", error);
      await interaction.editReply({ content: `❌ Error creando ticket: ${error.message}` });
    }
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
// LOGIN BOT
// --------------------------
client.login(process.env.DISCORD_TOKEN);