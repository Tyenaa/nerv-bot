// index.js
require('dotenv').config();
const { Client, GatewayIntentBits, Partials, PermissionsBitField, Collection, EmbedBuilder } = require('discord.js');
const express = require('express');

// --------------------
// CONFIG
// --------------------
const TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = '1490440780341448846'; // tu server
const STAFF_LOG_CHANNEL = '1490581213159620659'; // canal para logs
const WELCOME_CHANNEL = 'TU_WELCOME_CHANNEL_ID'; // reemplaza por tu canal de bienvenida
const STAFF_IDS = {
    owner: '1490466019720822884',
    admin: '1490466026356342804',
    mod: '1490466028545769473',
    helper: '1490466913237602324'
};
const ROLES = {
    muted: 'Muted',
    member: 'Member'
};

// --------------------
// CLIENT
// --------------------
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
    partials: [Partials.Channel, Partials.Message]
});

client.commands = new Collection();

// --------------------
// UPTIME ROBOT SERVER
// --------------------
const app = express();
app.get('/', (req, res) => res.send('Bot is alive!'));
app.listen(process.env.PORT || 8080, () => console.log('🌐 Servidor web corriendo'));

// --------------------
// READY EVENT
// --------------------
client.once('ready', async () => {
    console.log(`🔥 Bot listo como ${client.user.tag}`);

    // crear roles si no existen
    const guild = await client.guilds.fetch(GUILD_ID);
    for (const roleName of Object.values(ROLES)) {
        if (!guild.roles.cache.find(r => r.name === roleName)) {
            await guild.roles.create({ name: roleName, permissions: [] });
            console.log(`✅ Rol creado: ${roleName}`);
        }
    }
});

// --------------------
// WELCOME + AUTOROL
// --------------------
client.on('guildMemberAdd', async member => {
    const guild = member.guild;
    const role = guild.roles.cache.find(r => r.name === ROLES.member);
    if (role) await member.roles.add(role);

    const channel = guild.channels.cache.get(WELCOME_CHANNEL);
    if (channel) {
        channel.send(`🎉 Bienvenido ${member.user} al servidor! Te hemos dado el rol de ${ROLES.member}.`);
    }
});

// --------------------
// SLASH COMMANDS REGISTRATION
// --------------------
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
    new SlashCommandBuilder().setName('ping').setDescription('Revisa si el bot responde'),
    new SlashCommandBuilder().setName('tiers').setDescription('Muestra los tiers'),
    new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Da un warn a un usuario')
        .addUserOption(option => option.setName('usuario').setDescription('Usuario a advertir').setRequired(true))
        .addStringOption(option => option.setName('razon').setDescription('Razón').setRequired(true)),
    new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mutea a un usuario')
        .addUserOption(option => option.setName('usuario').setDescription('Usuario a mutear').setRequired(true))
        .addStringOption(option => option.setName('duracion').setDescription('Duración (ej: 10m, 1h)').setRequired(true))
        .addStringOption(option => option.setName('razon').setDescription('Razón').setRequired(true)),
    new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Banea a un usuario')
        .addUserOption(option => option.setName('usuario').setDescription('Usuario a banear').setRequired(true))
        .addStringOption(option => option.setName('duracion').setDescription('Duración (ej: 1d, perma)').setRequired(true))
        .addStringOption(option => option.setName('razon').setDescription('Razón').setRequired(true)),
    new SlashCommandBuilder().setName('apply').setDescription('Aplicar a tryouts'),
    new SlashCommandBuilder().setName('tryouts').setDescription('Comandos de tryouts')
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        console.log('🚀 Registrando slash commands...');
        await rest.put(Routes.applicationGuildCommands(client.user?.id || '0', GUILD_ID), { body: commands });
        console.log('✅ Slash commands registrados');
    } catch (err) {
        console.error(err);
    }
})();

// --------------------
// INTERACTION CREATE
// --------------------
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    // ----------------
    // PING
    // ----------------
    if (commandName === 'ping') {
        await interaction.reply('🏓 Pong!');
    }

    // ----------------
    // TIERS
    // ----------------
    else if (commandName === 'tiers') {
        await interaction.reply('💎 Aquí están los tiers...');
    }

    // ----------------
    // WARN
    // ----------------
    else if (commandName === 'warn') {
        const target = interaction.options.getUser('usuario');
        const reason = interaction.options.getString('razon');

        if (!Object.values(STAFF_IDS).includes(interaction.user.id)) {
            return interaction.reply({ content: '❌ No tienes permisos', ephemeral: true });
        }

        const logChannel = await client.channels.fetch(STAFF_LOG_CHANNEL);
        if (logChannel) logChannel.send(`⚠️ ${interaction.user.tag} le dio un WARN a ${target.tag}. Razón: ${reason}`);

        await interaction.reply({ content: `✅ ${target.tag} ha sido advertido.` });
    }

    // ----------------
    // MUTE
    // ----------------
    else if (commandName === 'mute') {
        const target = interaction.options.getUser('usuario');
        const duration = interaction.options.getString('duracion');
        const reason = interaction.options.getString('razon');

        if (!Object.values(STAFF_IDS).includes(interaction.user.id)) {
            return interaction.reply({ content: '❌ No tienes permisos', ephemeral: true });
        }

        const guild = interaction.guild;
        const member = guild.members.cache.get(target.id);
        const mutedRole = guild.roles.cache.find(r => r.name === ROLES.muted);

        if (member && mutedRole) {
            await member.roles.add(mutedRole);

            const logChannel = await client.channels.fetch(STAFF_LOG_CHANNEL);
            if (logChannel) logChannel.send(`🔇 ${interaction.user.tag} muteó a ${target.tag} por ${reason} (${duration})`);

            await interaction.reply({ content: `✅ ${target.tag} ha sido muteado por ${duration}.` });
        } else {
            await interaction.reply({ content: '❌ No se pudo mutear al usuario.', ephemeral: true });
        }
    }

    // ----------------
    // BAN
    // ----------------
    else if (commandName === 'ban') {
        const target = interaction.options.getUser('usuario');
        const duration = interaction.options.getString('duracion');
        const reason = interaction.options.getString('razon');

        if (![STAFF_IDS.owner, STAFF_IDS.admin, STAFF_IDS.mod].includes(interaction.user.id)) {
            return interaction.reply({ content: '❌ No tienes permisos', ephemeral: true });
        }

        const guild = interaction.guild;
        const member = guild.members.cache.get(target.id);
        if (member) {
            await member.ban({ reason: reason });

            const logChannel = await client.channels.fetch(STAFF_LOG_CHANNEL);
            if (logChannel) logChannel.send(`⛔ ${interaction.user.tag} baneó a ${target.tag} por ${reason} (${duration})`);

            await interaction.reply({ content: `✅ ${target.tag} ha sido baneado.` });
        } else {
            await interaction.reply({ content: '❌ No se pudo banear al usuario.', ephemeral: true });
        }
    }

    // ----------------
    // APPLY
    // ----------------
    else if (commandName === 'apply') {
        await interaction.reply('📩 Gracias por aplicar! Nuestro staff revisará tu solicitud.');
    }

    // ----------------
    // TRYOUTS
    // ----------------
    else if (commandName === 'tryouts') {
        await interaction.reply('🎯 Comandos de tryouts activados.');
    }
});

// --------------------
// LOGIN
// --------------------
client.login(TOKEN);