// ---------------------------
// NERV Bot - Moderación Avanzada
// ---------------------------
const { Client, GatewayIntentBits, Partials, Routes, REST, PermissionFlagsBits, ChannelType, PermissionsBitField } = require('discord.js');
const { token } = process.env; // tu token
const GUILD_ID = '1490440780341448846'; // ID del servidor
const CLIENT_ID = '1490451848442941480'; // Application ID del bot
const LOG_CHANNEL_ID = '1490581213159620659'; // Canal de logs

// Roles de staff
const ROLES = {
  owner: '1490466019720822884',
  admin: '1490466026356342804',
  mod: '1490466028545769473',
  helper: '1490466913237602324',
};

// Crear cliente
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel],
});

client.once('ready', async () => {
  console.log(`🔥 Bot listo como ${client.user.tag}`);

  // Crear rol Muted si no existe
  const guild = await client.guilds.fetch(GUILD_ID);
  let mutedRole = guild.roles.cache.find(r => r.name === 'Muted');
  if (!mutedRole) {
    mutedRole = await guild.roles.create({
      name: 'Muted',
      color: '#808080',
      permissions: [],
    });

    // Quitar permisos de enviar mensajes a todos los canales
    guild.channels.cache.forEach(async channel => {
      await channel.permissionOverwrites.edit(mutedRole, {
        SendMessages: false,
        AddReactions: false,
        Speak: false,
      });
    });
    console.log('✅ Rol Muted creado y permisos aplicados.');
  }

  // Registrar comandos slash
  const commands = [
    {
      name: 'warn',
      description: 'Dar un warn a un usuario',
      options: [
        {
          name: 'usuario',
          type: 6, // USER
          description: 'Usuario a advertir',
          required: true,
        },
        {
          name: 'razon',
          type: 3, // STRING
          description: 'Razón del warn',
          required: true,
        },
      ],
    },
    {
      name: 'mute',
      description: 'Silenciar a un usuario temporal o permanentemente',
      options: [
        { name: 'usuario', type: 6, description: 'Usuario a mutear', required: true },
        { name: 'tiempo', type: 3, description: 'Tiempo en minutos (dejar vacío para permanente)', required: false },
        { name: 'razon', type: 3, description: 'Razón del mute', required: true },
      ],
    },
    {
      name: 'ban',
      description: 'Banear a un usuario',
      options: [
        { name: 'usuario', type: 6, description: 'Usuario a banear', required: true },
        { name: 'tiempo', type: 3, description: 'Tiempo en minutos (dejar vacío para permanente)', required: false },
        { name: 'razon', type: 3, description: 'Razón del ban', required: true },
      ],
    },
  ];

  const rest = new REST({ version: '10' }).setToken(token);
  await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
  console.log('✅ Comandos slash registrados.');
});

// Función para verificar permisos según rol
function checkPermission(member, action) {
  if (member.roles.cache.has(ROLES.owner) || member.roles.cache.has(ROLES.admin)) return true;
  if (member.roles.cache.has(ROLES.mod)) {
    if (action === 'ban_perm') return false;
    return true;
  }
  if (member.roles.cache.has(ROLES.helper)) {
    if (['ban_perm', 'mute_perm'].includes(action)) return false;
    return action === 'warn' || action === 'mute_temp';
  }
  return false;
}

// Manejo de comandos slash
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, options, member } = interaction;
  const user = options.getUser('usuario');
  const reason = options.getString('razon');
  const time = options.getString('tiempo');

  const logChannel = await client.channels.fetch(LOG_CHANNEL_ID);

  // ---------- WARN ----------
  if (commandName === 'warn') {
    if (!checkPermission(member, 'warn')) return interaction.reply({ content: '❌ No tienes permisos para usar este comando.', ephemeral: true });

    await interaction.reply({ content: `⚠️ ${user.tag} ha recibido un warn por: ${reason}` });
    logChannel.send(`⚠️ **WARN**: ${user.tag} fue advertido por ${member.user.tag}.\n**Razón:** ${reason}`);
  }

  // ---------- MUTE ----------
  if (commandName === 'mute') {
    let mutePerm = !time; // si no hay tiempo, es permanente
    if (mutePerm && !checkPermission(member, 'mute_perm')) return interaction.reply({ content: '❌ No puedes mutear permanentemente.', ephemeral: true });
    if (!mutePerm && !checkPermission(member, 'mute_temp')) return interaction.reply({ content: '❌ No puedes mutear temporalmente.', ephemeral: true });

    const guildMember = await interaction.guild.members.fetch(user.id);
    const mutedRole = guildMember.guild.roles.cache.find(r => r.name === 'Muted');

    await guildMember.roles.add(mutedRole);

    if (time) {
      const minutes = parseInt(time);
      setTimeout(async () => {
        await guildMember.roles.remove(mutedRole).catch(() => {});
      }, minutes * 60 * 1000);
    }

    await interaction.reply({ content: `🔇 ${user.tag} ha sido silenciado ${time ? `por ${time} minutos` : 'permanentemente'} por: ${reason}` });
    logChannel.send(`🔇 **MUTE**: ${user.tag} fue silenciado por ${member.user.tag} ${time ? `por ${time} minutos` : 'permanentemente'}\n**Razón:** ${reason}`);
  }

  // ---------- BAN ----------
  if (commandName === 'ban') {
    let banPerm = !time; // si no hay tiempo, es permanente
    if (banPerm && !checkPermission(member, 'ban_perm')) return interaction.reply({ content: '❌ No puedes banear permanentemente.', ephemeral: true });
    if (!banPerm && !checkPermission(member, 'ban_temp')) return interaction.reply({ content: '❌ No puedes banear temporalmente.', ephemeral: true });

    const guildMember = await interaction.guild.members.fetch(user.id);
    await guildMember.ban({ reason });

    if (time) {
      const minutes = parseInt(time);
      setTimeout(async () => {
        await interaction.guild.members.unban(user.id).catch(() => {});
      }, minutes * 60 * 1000);
    }

    await interaction.reply({ content: `⛔ ${user.tag} ha sido baneado ${time ? `por ${time} minutos` : 'permanentemente'} por: ${reason}` });
    logChannel.send(`⛔ **BAN**: ${user.tag} fue baneado por ${member.user.tag} ${time ? `por ${time} minutos` : 'permanentemente'}\n**Razón:** ${reason}`);
  }
});

client.login(token);