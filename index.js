const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes } = require('discord.js');
const fs = require('fs');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

const TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = 'TU_GUILD_ID'; // reemplaza con tu guild id
const LOG_CHANNEL_ID = '1490581213159620659'; // canal de logs

// IDs de roles de staff
const STAFF_ROLES = {
    helper: '1490466913237602324',
    mod: '1490466028545769473',
    admin: '1490466026356342804',
    owner: '1490466019720822884'
};

// Moderation JSON
let moderationData = {};
if (fs.existsSync('moderation.json')) {
    moderationData = JSON.parse(fs.readFileSync('moderation.json'));
}

function saveModerationData() {
    fs.writeFileSync('moderation.json', JSON.stringify(moderationData, null, 2));
}

// Crear rol Muted si no existe
client.on('ready', async () => {
    console.log(`🔥 Bot listo como ${client.user.tag}`);
    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) return console.error("Guild no encontrada.");

    if (!guild.roles.cache.find(r => r.name === 'Muted')) {
        await guild.roles.create({ name: 'Muted', color: '#808080', permissions: [] });
        console.log('✅ Rol Muted creado');
    }

    // Registrar comandos slash
    const commands = [
        new SlashCommandBuilder().setName('warn').setDescription('Advierte a un usuario')
            .addUserOption(o => o.setName('usuario').setDescription('Usuario a advertir').setRequired(true))
            .addStringOption(o => o.setName('razon').setDescription('Razón')),
        new SlashCommandBuilder().setName('mute').setDescription('Mutea a un usuario temporal o permanentemente')
            .addUserOption(o => o.setName('usuario').setDescription('Usuario a mutear').setRequired(true))
            .addStringOption(o => o.setName('duracion').setDescription('Duración: 10m, 1h, perma').setRequired(true))
            .addStringOption(o => o.setName('razon').setDescription('Razón')),
        new SlashCommandBuilder().setName('ban').setDescription('Banea a un usuario')
            .addUserOption(o => o.setName('usuario').setDescription('Usuario a banear').setRequired(true))
            .addStringOption(o => o.setName('duracion').setDescription('Duración: 1d, 7d, perma').setRequired(true))
            .addStringOption(o => o.setName('razon').setDescription('Razón')),
        new SlashCommandBuilder().setName('kick').setDescription('Expulsa a un usuario')
            .addUserOption(o => o.setName('usuario').setDescription('Usuario a expulsar').setRequired(true))
            .addStringOption(o => o.setName('razon').setDescription('Razón'))
    ].map(cmd => cmd.toJSON());

    const rest = new REST({ version: '10' }).setToken(TOKEN);
    await rest.put(Routes.applicationGuildCommands(client.user.id, GUILD_ID), { body: commands });
    console.log('✅ Comandos slash registrados');
});

// Verificar permisos según rol
function canDo(member, action) {
    if (member.roles.cache.has(STAFF_ROLES.owner) || member.roles.cache.has(STAFF_ROLES.admin)) return true;
    if (member.roles.cache.has(STAFF_ROLES.mod)) {
        if (action === 'warn' || action === 'kick') return false;
        return !['ban_perma'].includes(action);
    }
    if (member.roles.cache.has(STAFF_ROLES.helper)) {
        return ['warn', 'mute_temporal'].includes(action);
    }
    return false;
}

// Interacciones
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, options, guild, member } = interaction;
    const logChannel = guild.channels.cache.get(LOG_CHANNEL_ID);
    if (!logChannel) return;

    const targetUser = options.getUser('usuario');
    const reason = options.getString('razon') || 'No especificada';

    if (!moderationData[targetUser.id]) moderationData[targetUser.id] = { warns: 0, mutes: 0, bans: 0 };
    
    const targetMember = guild.members.cache.get(targetUser.id);
    const mutedRole = guild.roles.cache.find(r => r.name === 'Muted');

    // ----- WARN -----
    if (commandName === 'warn') {
        if (!canDo(member, 'warn')) return interaction.reply({ content: '❌ No tienes permisos para dar warn', ephemeral: true });

        moderationData[targetUser.id].warns += 1;
        saveModerationData();

        const embed = new EmbedBuilder()
            .setTitle('⚠️ Usuario Advertido')
            .addFields(
                { name: 'Usuario', value: `${targetUser.tag}` },
                { name: 'Moderador', value: `${interaction.user.tag}` },
                { name: 'Razón', value: reason },
                { name: 'Warns Totales', value: `${moderationData[targetUser.id].warns}` }
            )
            .setColor('#FFA500')
            .setTimestamp();

        logChannel.send({ embeds: [embed] });
        return interaction.reply({ content: `✅ ${targetUser.tag} advertido`, ephemeral: true });
    }

    // ----- MUTE -----
    if (commandName === 'mute') {
        let durationStr = options.getString('duracion');
        let actionType = durationStr === 'perma' ? 'mute_perma' : 'mute_temporal';
        if (!canDo(member, actionType)) return interaction.reply({ content: '❌ No tienes permisos para mutear así', ephemeral: true });

        let duration = 0;
        if (durationStr !== 'perma') {
            if (durationStr.endsWith('m')) duration = parseInt(durationStr) * 60 * 1000;
            else if (durationStr.endsWith('h')) duration = parseInt(durationStr) * 60 * 60 * 1000;
            else return interaction.reply({ content: 'Formato inválido. Usa 10m, 1h o perma', ephemeral: true });
        }

        await targetMember.roles.add(mutedRole, reason);
        moderationData[targetUser.id].mutes += 1;
        saveModerationData();

        const embed = new EmbedBuilder()
            .setTitle('🔇 Usuario Muted')
            .addFields(
                { name: 'Usuario', value: `${targetUser.tag}` },
                { name: 'Moderador', value: `${interaction.user.tag}` },
                { name: 'Razón', value: reason },
                { name: 'Duración', value: durationStr }
            )
            .setColor('#808080')
            .setTimestamp();

        logChannel.send({ embeds: [embed] });
        interaction.reply({ content: `✅ ${targetUser.tag} ha sido muted ${durationStr}`, ephemeral: true });

        if (duration > 0) {
            setTimeout(async () => {
                if (targetMember.roles.cache.has(mutedRole.id)) {
                    await targetMember.roles.remove(mutedRole, 'Mute expirado');
                    logChannel.send({ content: `⏰ ${targetUser.tag} desmuteado automáticamente` });
                }
            }, duration);
        }
    }

    // ----- BAN -----
    if (commandName === 'ban') {
        let durationStr = options.getString('duracion');
        let actionType = durationStr === 'perma' ? 'ban_perma' : 'ban_temporal';
        if (!canDo(member, actionType)) return interaction.reply({ content: '❌ No tienes permisos para banear así', ephemeral: true });

        await targetMember.ban({ reason });
        moderationData[targetUser.id].bans += 1;
        saveModerationData();

        const embed = new EmbedBuilder()
            .setTitle('⛔ Usuario Baneado')
            .addFields(
                { name: 'Usuario', value: `${targetUser.tag}` },
                { name: 'Moderador', value: `${interaction.user.tag}` },
                { name: 'Razón', value: reason },
                { name: 'Duración', value: durationStr }
            )
            .setColor('#FF0000')
            .setTimestamp();

        logChannel.send({ embeds: [embed] });
        return interaction.reply({ content: `✅ ${targetUser.tag} baneado ${durationStr}`, ephemeral: true });
    }

    // ----- KICK -----
    if (commandName === 'kick') {
        if (!canDo(member, 'kick')) return interaction.reply({ content: '❌ No tienes permisos para kick', ephemeral: true });

        await targetMember.kick(reason);
        const embed = new EmbedBuilder()
            .setTitle('👢 Usuario Expulsado')
            .addFields(
                { name: 'Usuario', value: `${targetUser.tag}` },
                { name: 'Moderador', value: `${interaction.user.tag}` },
                { name: 'Razón', value: reason }
            )
            .setColor('#FFAA00')
            .setTimestamp();

        logChannel.send({ embeds: [embed] });
        return interaction.reply({ content: `✅ ${targetUser.tag} expulsado`, ephemeral: true });
    }
});

client.login(TOKEN);