/**
 * Owner Commands for Hisoka-md/his-v0
 * Bot owner management and control utilities
 */

const { commands } = require('../lib/commands.js');
const { bot } = require('../settings.js');
const { usersDB, groupsDB, blockUser, unblockUser, getStats } = require('../lib/database.js');
const { getBotInstance } = require('../lib/bot-instance.js');
const { Func } = require('../lib/functions.js');

// Block user command
commands.add({
    name: ['block'],
    command: ['block'],
    category: 'owner',
    desc: 'Block a user from using the bot',
    usage: '<user_id|reply>',
    example: '628xxxxxxxxx',
    owner: true,
    run: async ({ args, m, reply }) => {
        let userId;
        
        // Check if replying to a message
        if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            userId = m.message.extendedTextMessage.contextInfo.participant;
        } else if (args[0]) {
            userId = args[0].replace(/[^\d]/g, '') + '@s.whatsapp.net';
        } else {
            return await reply('❌ Please provide a user ID or reply to a message.');
        }
        
        blockUser(userId);
        await reply(`✅ User ${userId.split('@')[0]} has been blocked.`);
    }
});

// Unblock user command
commands.add({
    name: ['unblock'],
    command: ['unblock'],
    category: 'owner',
    desc: 'Unblock a user',
    usage: '<user_id>',
    example: '628xxxxxxxxx',
    owner: true,
    run: async ({ args, reply }) => {
        if (!args[0]) {
            return await reply('❌ Please provide a user ID.');
        }
        
        const userId = args[0].replace(/[^\d]/g, '') + '@s.whatsapp.net';
        unblockUser(userId);
        await reply(`✅ User ${userId.split('@')[0]} has been unblocked.`);
    }
});

// List blocked users
commands.add({
    name: ['blocklist'],
    command: ['blocklist'],
    category: 'owner',
    desc: 'Show list of blocked users',
    owner: true,
    run: async ({ reply }) => {
        const users = usersDB.all();
        const blockedUsers = Object.entries(users).filter(([id, data]) => data.blocked);
        
        if (blockedUsers.length === 0) {
            return await reply('✅ No blocked users.');
        }
        
        let blockList = `╭─「 *Blocked Users* 」\n`;
        for (const [userId, userData] of blockedUsers) {
            const phoneNumber = userId.split('@')[0];
            blockList += `│ ${phoneNumber}\n`;
        }
        blockList += `╰────────────────────\n\n`;
        blockList += `Total: ${blockedUsers.length} blocked users`;
        
        await reply(blockList);
    }
});

// Broadcast message
commands.add({
    name: ['broadcast'],
    command: ['broadcast', 'bc'],
    alias: ['bcall'],
    category: 'owner',
    desc: 'Broadcast message to all users/groups',
    usage: '<text>',
    example: 'Important announcement!',
    owner: true,
    query: true,
    run: async ({ args, rav, reply }) => {
        const message = args.join(' ');
        const users = usersDB.keys();
        const groups = groupsDB.keys();
        
        let successCount = 0;
        let failCount = 0;
        
        const broadcastMessage = `📢 *Broadcast Message*\n\n${message}\n\n_- ${bot.creator}_`;
        
        // Send to all users
        for (const userId of users) {
            try {
                await getBotInstance().sendMessage(userId, { text: broadcastMessage });
                successCount++;
                await new Promise(resolve => setTimeout(resolve, 100)); // Delay to avoid spam
            } catch (error) {
                failCount++;
            }
        }
        
        // Send to all groups
        for (const groupId of groups) {
            try {
                await getBotInstance().sendMessage(groupId, { text: broadcastMessage });
                successCount++;
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                failCount++;
            }
        }
        
        await reply(`✅ Broadcast completed!\n📤 Sent: ${successCount}\n❌ Failed: ${failCount}`);
    }
});

// Restart bot
commands.add({
    name: ['restart'],
    command: ['restart'],
    category: 'owner',
    desc: 'Restart the bot',
    owner: true,
    run: async ({ reply }) => {
        await reply('🔄 Restarting bot...');
        process.exit(0);
    }
});

// Evaluate JavaScript code
commands.add({
    name: ['eval'],
    command: ['eval', 'exec'],
    category: 'owner',
    desc: 'Execute JavaScript code (DANGEROUS)',
    usage: '<code>',
    example: 'console.log("Hello World")',
    owner: true,
    query: true,
    run: async ({ args, rav, m, reply }) => {
        const code = args.join(' ');
        
        try {
            const result = await eval(`(async () => { ${code} })()`);
            const output = typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result);
            
            await reply(`✅ Code executed successfully:\n\`\`\`\n${output}\n\`\`\``);
        } catch (error) {
            await reply(`❌ Execution error:\n\`\`\`\n${error.message}\n\`\`\``);
        }
    }
});

// Clear database
commands.add({
    name: ['cleardb'],
    command: ['cleardb'],
    category: 'owner',
    desc: 'Clear specific database (users/groups)',
    usage: '<users|groups>',
    example: 'users',
    owner: true,
    run: async ({ args, reply }) => {
        if (!args[0]) {
            return await reply('❌ Specify what to clear: users or groups');
        }
        
        const target = args[0].toLowerCase();
        
        if (target === 'users') {
            usersDB.clear();
            await reply('✅ Users database cleared.');
        } else if (target === 'groups') {
            groupsDB.clear();
            await reply('✅ Groups database cleared.');
        } else {
            await reply('❌ Invalid option. Use: users or groups');
        }
    }
});

// Database backup
commands.add({
    name: ['backup'],
    command: ['backup'],
    category: 'owner',
    desc: 'Create database backup',
    owner: true,
    run: async ({ rav, m, reply }) => {
        try {
            const stats = getStats();
            const backup = {
                timestamp: new Date().toISOString(),
                version: bot.version,
                stats,
                users: usersDB.all(),
                groups: groupsDB.all()
            };
            
            const backupData = JSON.stringify(backup, null, 2);
            const filename = `hisoka-backup-${Date.now()}.json`;
            
            await getBotInstance().sendMessage(m.key.remoteJid, {
                document: Buffer.from(backupData),
                fileName: filename,
                mimetype: 'application/json',
                caption: `📄 Database backup created\n📊 ${stats.totalUsers} users, ${stats.totalGroups} groups`
            });
            
        } catch (error) {
            await reply(`❌ Backup failed: ${error.message}`);
        }
    }
});

// Set bot status
commands.add({
    name: ['setstatus'],
    command: ['setstatus'],
    category: 'owner',
    desc: 'Set bot status message',
    usage: '<status>',
    example: 'Hisoka-md/his-v0 Online',
    owner: true,
    query: true,
    run: async ({ args, rav, reply }) => {
        try {
            const status = args.join(' ');
            await getBotInstance().updateProfileStatus(status);
            await reply(`✅ Status updated to: ${status}`);
        } catch (error) {
            await reply(`❌ Failed to update status: ${error.message}`);
        }
    }
});

// Get bot profile
commands.add({
    name: ['profile'],
    command: ['profile'],
    category: 'owner',
    desc: 'Get bot profile information',
    owner: true,
    run: async ({ rav, reply }) => {
        try {
            const profile = await getBotInstance().fetchStatus(getBotInstance().user.id);
            const ppUrl = await getBotInstance().profilePictureUrl(getBotInstance().user.id, 'image').catch(() => null);
            
            let profileInfo = `╭─「 *Bot Profile* 」\n`;
            profileInfo += `│ 📱 *Number:* ${getBotInstance().user.id.split(':')[0]}\n`;
            profileInfo += `│ 📝 *Status:* ${profile?.status || 'No status'}\n`;
            profileInfo += `│ 🖼️ *Profile Picture:* ${ppUrl ? 'Available' : 'Not set'}\n`;
            profileInfo += `╰────────────────────`;
            
            if (ppUrl) {
                await getBotInstance().sendMessage(m.key.remoteJid, {
                    image: { url: ppUrl },
                    caption: profileInfo
                });
            } else {
                await reply(profileInfo);
            }
        } catch (error) {
            await reply(`❌ Failed to get profile: ${error.message}`);
        }
    }
});

// Command management
commands.add({
    name: ['togglecmd'],
    command: ['togglecmd'],
    category: 'owner',
    desc: 'Enable or disable a command',
    usage: '<command_name>',
    example: 'ping',
    owner: true,
    run: async ({ args, reply }) => {
        if (!args[0]) {
            return await reply('❌ Please provide a command name.');
        }
        
        const cmdName = args[0].toLowerCase();
        const command = commands.findCommand(cmdName);
        
        if (!command) {
            return await reply('❌ Command not found.');
        }
        
        const newState = !command.enable;
        commands.setCommandState(command.name[0], newState);
        
        await reply(`✅ Command "${command.name[0]}" has been ${newState ? 'enabled' : 'disabled'}.`);
    }
});

console.log('✅ Owner commands loaded');
