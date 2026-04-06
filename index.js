// index.js
const { Client, GatewayIntentBits, Partials, Collection, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events, REST, Routes, SlashCommandBuilder } = require('discord.js');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel]
});
require('dotenv').config();

// --- IDS que me diste ---
const GUILD_ID = '1490440780341448846';
const WELCOME_CHANNEL_ID = 'TU_CANAL_DE_BIENVENIDA'; // reemplaza con el canal real si quieres
const STAFF_LOG_CHANNEL = '1490581213159620659';
const CLIENT_ID = '1490451848442941480';

// Roles staff
const STAFF_ROLES = {
    owner: '1490466019720822884',
    admin: '1490466026356342804',
    mod: '1490466028545769473',
    helper: '1490466913237602324'
};

// Roles automáticos
const MEMBER_ROLE_NAME = 'Miembro';
const MUTED_ROLE_NAME = 'Muted';

// --- Comandos ---
const commands = [
    new SlashCommandBuilder().setName('ping').setDescription('Comprueba si el bot está activo'),
    new SlashCommandBuilder().setName('warn').setDescription('Dar un warn a un usuario')
        .addUserOption(o => o.setName('usuario').setDescription('Usuario a advertir').setRequired(true))
        .addStringOption(o => o.setName('razon').setDescription('Razón del warn').setRequired(true)),
    new SlashCommandBuilder().setName('mute').setDescription('Silenciar a un usuario')
        .addUserOption(o => o.setName('usuario').setDescription('Usuario a mutear').setRequired(true))
        .addStringOption(o => o.setName('duracion').setDescription('Duración del mute (ej: 10m, 1h)').setRequired(true)),
    new SlashCommandBuilder().setName('ban').setDescription('Banea a un usuario')
        .addUserOption(o => o.setName('usuario').setDescription('Usuario a banear').setRequired(true))
        .addStringOption(o => o.setName('razon').setDescription('Razón del baneo').setRequired(true)),
    new SlashCommandBuilder().setName('kick').setDescription('Expulsa a un usuario')
        .addUserOption(o => o.setName('usuario').setDescription('Usuario a expulsar').setRequired(true))
        .addStringOption(o => o.setName('razon').setDescription('Razón de la expulsión').setRequired(true)),
].map(cmd => cmd.toJSON());

// --- Registrar comandos ---
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
(async () => {
    try {
        console.log('🔄 Registrando comandos...');
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
        console.log('✅ Comandos registrados!');
    } catch (err) {
        console.error(err);
    }
})();

// --- Inicio del bot ---
client.once('ready', async () => {
    console.log(`🔥 Bot listo como ${client.user.tag}`);

    const guild = await client.guilds.fetch(GUILD_ID);
    const roles = await guild.roles.fetch();

    // Crear roles automáticos si no existen
    if (!roles.find(r => r.name === MUTED_ROLE_NAME)) await guild.roles.create({ name: MUTED_ROLE_NAME, color: 'GREY', reason: 'Rol de muteo automático' });
    if (!roles.find(r => r.name === MEMBER_ROLE_NAME)) await guild.roles.create({ name: MEMBER_ROLE_NAME, color: 'BLUE', reason: 'Rol de miembros' });
});

// --- Bienvenida + autorol ---
client.on(Events.GuildMemberAdd, async member => {
    const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (channel) channel.send(`Bienvenido/a ${member} al servidor! 🎉`);

    const memberRole = member.guild.roles.cache.find(r => r.name === MEMBER_ROLE_NAME);
    if (memberRole) await member.roles.add(memberRole).catch(console.error);
});

// --- Manejo de comandos ---
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const { commandName, options } = interaction;

    const logChannel = await client.channels.fetch(STAFF_LOG_CHANNEL);

    if (commandName === 'ping') await interaction.reply({ content: '🏓 Pong!', ephemeral: true });

    if (commandName === 'warn') {
        const user = options.getUser('usuario');
        const reason = options.getString('razon');
        await interaction.reply(`⚠️ ${user.tag} ha recibido un warn. Razón: ${reason}`);
        logChannel.send(`**WARN**: ${user.tag} | ${interaction.user.tag} | Razón: ${reason}`);
    }

    if (commandName === 'mute') {
        const user = options.getUser('usuario');
        const duration = options.getString('duracion');
        const guildMember = await interaction.guild.members.fetch(user.id);
        const muteRole = interaction.guild.roles.cache.find(r => r.name === MUTED_ROLE_NAME);
        if (!muteRole) return interaction.reply({ content: 'No existe el rol Muted', ephemeral: true });

        await guildMember.roles.add(muteRole).catch(console.error);
        await interaction.reply(`🔇 ${user.tag} ha sido muteado por ${duration}`);
        logChannel.send(`**MUTE**: ${user.tag} | ${interaction.user.tag} | Duración: ${duration}`);
    }

    if (commandName === 'ban') {
        const user = options.getUser('usuario');
        const reason = options.getString('razon');
        const guildMember = await interaction.guild.members.fetch(user.id);
        await guildMember.ban({ reason }).catch(console.error);
        await interaction.reply(`⛔ ${user.tag} ha sido baneado. Razón: ${reason}`);
        logChannel.send(`**BAN**: ${user.tag} | ${interaction.user.tag} | Razón: ${reason}`);
    }

    if (commandName === 'kick') {
        const user = options.getUser('usuario');
        const reason = options.getString('razon');
        const guildMember = await interaction.guild.members.fetch(user.id);
        await guildMember.kick(reason).catch(console.error);
        await interaction.reply(`👢 ${user.tag} ha sido expulsado. Razón: ${reason}`);
        logChannel.send(`**KICK**: ${user.tag} | ${interaction.user.tag} | Razón: ${reason}`);
    }
});

// --- Botones Tiers + Tryouts ---
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isButton()) return;

    const tierData = {
        t1: { name: 'Profesionales', emoji: '🏆', requirement: 'Top 2 SSL - Grand Champion 3' },
        t2: { name: 'Competitivos', emoji: '⚡', requirement: 'Grand Champion 3' },
        t3: { name: 'Veteranos', emoji: '🎯', requirement: 'Grand Champion 2 a Champion 3' },
        t4: { name: 'Aspirantes', emoji: '📈', requirement: 'Champion 2 a Diamond 3' },
        t5: { name: 'En Progreso', emoji: '🔰', requirement: 'Diamond 2 para abajo' }
    };

    if (tierData[interaction.customId]) {
        const tier = tierData[interaction.customId];
        await interaction.reply({
            embeds: [{
                title: 'Postulación para Tiers',
                description: `Estás por postularte al tier **${tier.name}** ${tier.emoji}\nRequisitos: ${tier.requirement}\nPor favor indica tu rango actual y tu ID del juego.`,
                color: 0x00FF00
            }],
            ephemeral: true
        });
    }
});

client.login(process.env.DISCORD_TOKEN);