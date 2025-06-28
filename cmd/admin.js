/**
 * Admin Commands for Hisoka-md/his-v0
 * Administrative utilities and bot management
 */

const { commands } = require('../lib/commands.js');
const { bot, isOwner } = require('../settings.js');
const { updateUser, getUser, usersDB, groupsDB, getStats } = require('../lib/database.js');
const { Func } = require('../lib/functions.js');
const { getBotInstance, isAdmin, isBotAdmin, sendMessage } = require('../lib/bot-instance.js');

// Enable/disable commands
commands.add({
    name: ['enable'],
    command: ['enable'],
    category: 'admin',
    desc: 'Enable a disabled command',
    usage: '<command_name>',
    example: 'ping',
    admin: true,
    run: async ({ args, reply }) => {
        if (!args[0]) {
            return await reply('❌ Please provide a command name to enable.');
        }
        
        const cmdName = args[0].toLowerCase();
        const command = commands.findCommand(cmdName);
        
        if (!command) {
            return await reply('❌ Command not found.');
        }
        
        if (command.enable) {
            return await reply(`✅ Command "${command.name[0]}" is already enabled.`);
        }
        
        commands.setCommandState(command.name[0], true);
        await reply(`✅ Command "${command.name[0]}" has been enabled.`);
    }
});

// Disable commands
commands.add({
    name: ['disable'],
    command: ['disable'],
    category: 'admin',
    desc: 'Disable an active command',
    usage: '<command_name>',
    example: 'ping',
    admin: true,
    run: async ({ args, reply }) => {
        if (!args[0]) {
            return await reply('❌ Please provide a command name to disable.');
        }
        
        const cmdName = args[0].toLowerCase();
        const command = commands.findCommand(cmdName);
        
        if (!command) {
            return await reply('❌ Command not found.');
        }
        
        // Prevent disabling critical commands
        const criticalCommands = ['help', 'enable', 'disable'];
        if (criticalCommands.includes(command.name[0])) {
            return await reply('❌ Cannot disable critical system commands.');
        }
        
        if (!command.enable) {
            return await reply(`❌ Command "${command.name[0]}" is already disabled.`);
        }
        
        commands.setCommandState(command.name[0], false);
        await reply(`✅ Command "${command.name[0]}" has been disabled.`);
    }
});

// List disabled commands
commands.add({
    name: ['disabled'],
    command: ['disabled'],
    category: 'admin',
    desc: 'Show list of disabled commands',
    admin: true,
    run: async ({ reply }) => {
        const allCommands = commands.getAllCommands();
        const disabledCommands = allCommands.filter(cmd => !cmd.enable);
        
        if (disabledCommands.length === 0) {
            return await reply('✅ All commands are currently enabled.');
        }
        
        let disabledList = `╭─「 *Disabled Commands* 」\n`;
        for (const cmd of disabledCommands) {
            disabledList += `│ ${bot.prefix[0]}${cmd.command[0]} - ${cmd.desc}\n`;
        }
        disabledList += `╰────────────────────\n\n`;
        disabledList += `Total: ${disabledCommands.length} disabled commands`;
        
        await reply(disabledList);
    }
});

// Clean up system resources
commands.add({
    name: ['cleanup'],
    command: ['cleanup'],
    category: 'admin',
    desc: 'Clean up temporary files and expired data',
    owner: true,
    run: async ({ reply }) => {
        try {
            let cleanupReport = '🧹 *System Cleanup Report*\n\n';
            
            // Clean up cooldowns
            const cooldownsBefore = commands.cooldowns.size;
            commands.cleanupCooldowns();
            const cooldownsAfter = commands.cooldowns.size;
            const cooldownsCleaned = cooldownsBefore - cooldownsAfter;
            
            cleanupReport += `• Cooldowns cleaned: ${cooldownsCleaned}\n`;
            
            // Clean up temp files
            const tempCleanup = await Func.execCommand('find ./temp -type f -mtime +1 -delete 2>/dev/null || true');
            cleanupReport += `• Temporary files: Cleaned\n`;
            
            // Memory usage before/after
            const memoryBefore = process.memoryUsage().heapUsed;
            if (global.gc) {
                global.gc();
            }
            const memoryAfter = process.memoryUsage().heapUsed;
            const memorySaved = memoryBefore - memoryAfter;
            
            cleanupReport += `• Memory freed: ${Func.formatSize(memorySaved)}\n`;
            cleanupReport += `• Current memory usage: ${Func.formatSize(memoryAfter)}\n`;
            
            cleanupReport += '\n✅ Cleanup completed successfully!';
            
            await reply(cleanupReport);
        } catch (error) {
            await reply(`❌ Cleanup failed: ${error.message}`);
        }
    }
});

// Bot performance monitoring
commands.add({
    name: ['performance'],
    command: ['performance', 'perf'],
    category: 'admin',
    desc: 'Show bot performance metrics',
    admin: true,
    run: async ({ reply }) => {
        try {
            const stats = getStats();
            const cmdStats = commands.getStats();
            const uptime = process.uptime();
            const memory = process.memoryUsage();
            
            let perfReport = `╭─「 *Performance Metrics* 」\n`;
            perfReport += `│ ⏱️ *Uptime:* ${Func.formatTime(uptime * 1000)}\n`;
            perfReport += `│ 🧠 *Memory Used:* ${Func.formatSize(memory.heapUsed)}\n`;
            perfReport += `│ 💾 *Memory Total:* ${Func.formatSize(memory.heapTotal)}\n`;
            perfReport += `│ 📊 *Memory Usage:* ${(memory.heapUsed / memory.heapTotal * 100).toFixed(1)}%\n`;
            perfReport += `│ 👥 *Active Users:* ${stats.totalUsers}\n`;
            perfReport += `│ 🏘️ *Active Groups:* ${stats.totalGroups}\n`;
            perfReport += `│ ⚡ *Commands Executed:* ${cmdStats.totalUsage}\n`;
            perfReport += `│ ❌ *Command Errors:* ${cmdStats.totalErrors}\n`;
            perfReport += `│ ✅ *Success Rate:* ${cmdStats.successRate}%\n`;
            perfReport += `│ 🔄 *Commands/Hour:* ${Math.round(cmdStats.totalUsage / (uptime / 3600))}\n`;
            perfReport += `╰────────────────────`;
            
            await reply(perfReport);
        } catch (error) {
            await reply(`❌ Error getting performance metrics: ${error.message}`);
        }
    }
});

// User management utilities
commands.add({
    name: ['userinfo'],
    command: ['userinfo'],
    category: 'admin',
    desc: 'Get information about a user',
    usage: '<@user|reply|phone>',
    example: '@628xxxxxxxxx',
    admin: true,
    run: async ({ args, m, reply }) => {
        try {
            let userId;
            
            // Check if replying to a message
            if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                userId = m.message.extendedTextMessage.contextInfo.participant;
            } else if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
                userId = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
            } else if (args[0]) {
                userId = args[0].replace(/[^\d]/g, '') + '@s.whatsapp.net';
            } else {
                return await reply('❌ Please mention a user, reply to their message, or provide a phone number.');
            }
            
            const userData = getUser(userId);
            if (!userData) {
                return await reply('❌ User not found in database.');
            }
            
            const phoneNumber = userId.split('@')[0];
            const registeredDate = new Date(userData.registered).toLocaleDateString();
            const lastSeenDate = new Date(userData.lastSeen).toLocaleDateString();
            const commandsUsed = userData.commandsUsed || 0;
            
            let userInfo = `╭─「 *User Information* 」\n`;
            userInfo += `│ 📱 *Phone:* +${phoneNumber}\n`;
            userInfo += `│ 📅 *Registered:* ${registeredDate}\n`;
            userInfo += `│ 👁️ *Last Seen:* ${lastSeenDate}\n`;
            userInfo += `│ ⚡ *Commands Used:* ${commandsUsed}\n`;
            userInfo += `│ 🚫 *Blocked:* ${userData.blocked ? 'Yes' : 'No'}\n`;
            userInfo += `│ 👑 *Owner:* ${isOwner(userId) ? 'Yes' : 'No'}\n`;
            userInfo += `╰────────────────────`;
            
            await reply(userInfo);
        } catch (error) {
            await reply(`❌ Error getting user info: ${error.message}`);
        }
    }
});

// Reset user data
commands.add({
    name: ['resetuser'],
    command: ['resetuser'],
    category: 'admin',
    desc: 'Reset user statistics',
    usage: '<@user|reply|phone>',
    example: '@628xxxxxxxxx',
    owner: true,
    run: async ({ args, m, reply }) => {
        try {
            let userId;
            
            if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                userId = m.message.extendedTextMessage.contextInfo.participant;
            } else if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
                userId = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
            } else if (args[0]) {
                userId = args[0].replace(/[^\d]/g, '') + '@s.whatsapp.net';
            } else {
                return await reply('❌ Please mention a user, reply to their message, or provide a phone number.');
            }
            
            const userData = getUser(userId);
            if (!userData) {
                return await reply('❌ User not found in database.');
            }
            
            // Reset user stats but keep essential data
            updateUser(userId, {
                commandsUsed: 0,
                lastSeen: Date.now()
            });
            
            await reply(`✅ User statistics reset for +${userId.split('@')[0]}`);
        } catch (error) {
            await reply(`❌ Error resetting user: ${error.message}`);
        }
    }
});

// Global announcement
commands.add({
    name: ['announce'],
    command: ['announce'],
    category: 'admin',
    desc: 'Send announcement to all groups (admin only)',
    usage: '<message>',
    example: 'Important bot update notice',
    owner: true,
    query: true,
    run: async ({ args, rav, reply }) => {
        try {
            const message = args.join(' ');
            const groups = groupsDB.keys();
            
            let successCount = 0;
            let failCount = 0;
            
            const announcement = `📢 *Bot Announcement*\n\n${message}\n\n_- Bot Administrator_`;
            
            for (const groupId of groups) {
                try {
                    await getBotInstance().sendMessage(groupId, { text: announcement });
                    successCount++;
                    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
                } catch (error) {
                    failCount++;
                }
            }
            
            await reply(`📢 Announcement sent!\n✅ Success: ${successCount} groups\n❌ Failed: ${failCount} groups`);
        } catch (error) {
            await reply(`❌ Error sending announcement: ${error.message}`);
        }
    }
});

// Command usage statistics
commands.add({
    name: ['cmdstats'],
    command: ['cmdstats'],
    category: 'admin',
    desc: 'Show detailed command usage statistics',
    admin: true,
    run: async ({ reply }) => {
        try {
            const topCommands = commands.getTopCommands(15);
            const cmdStats = commands.getStats();
            
            let statsText = `╭─「 *Command Statistics* 」\n`;
            statsText += `│ 📊 *Total Commands:* ${cmdStats.totalCommands}\n`;
            statsText += `│ ⚡ *Total Usage:* ${cmdStats.totalUsage}\n`;
            statsText += `│ ❌ *Total Errors:* ${cmdStats.totalErrors}\n`;
            statsText += `│ ✅ *Success Rate:* ${cmdStats.successRate}%\n`;
            statsText += `╰────────────────────\n\n`;
            
            if (topCommands.length > 0) {
                statsText += `╭─「 *Top Commands* 」\n`;
                for (let i = 0; i < topCommands.length; i++) {
                    const cmd = topCommands[i];
                    const lastUsed = cmd.lastUsed ? new Date(cmd.lastUsed).toLocaleDateString() : 'Never';
                    statsText += `│ ${i + 1}. ${cmd.name} - ${cmd.usage} uses\n`;
                    statsText += `│    Last used: ${lastUsed}\n`;
                }
                statsText += `╰────────────────────`;
            }
            
            await reply(statsText);
        } catch (error) {
            await reply(`❌ Error getting command stats: ${error.message}`);
        }
    }
});

// Set bot mode
commands.add({
    name: ['setmode'],
    command: ['setmode'],
    category: 'admin',
    desc: 'Set bot mode (public/private)',
    usage: '<public/private>',
    example: 'private',
    owner: true,
    run: async ({ args, reply }) => {
        if (!args[0]) {
            return await reply(`❌ Current mode: ${bot.mode}\n\nUsage: setmode <public/private>`);
        }
        
        const mode = args[0].toLowerCase();
        if (!['public', 'private'].includes(mode)) {
            return await reply('❌ Mode must be either "public" or "private"');
        }
        
        bot.mode = mode;
        await reply(`✅ Bot mode set to: ${mode}`);
    }
});

// Anti-spam management
commands.add({
    name: ['antispam'],
    command: ['antispam'],
    category: 'admin',
    desc: 'Configure anti-spam settings',
    usage: '<on/off> [max_commands]',
    example: 'on 10',
    admin: true,
    run: async ({ args, reply }) => {
        if (!args[0]) {
            const status = bot.security.antiSpam ? 'ON' : 'OFF';
            const maxCommands = bot.security.maxCommands;
            
            let info = `╭─「 *Anti-Spam Settings* 」\n`;
            info += `│ 🛡️ *Status:* ${status}\n`;
            info += `│ 📊 *Max Commands/min:* ${maxCommands}\n`;
            info += `│ ⏱️ *Cooldown:* ${bot.security.cooldown}ms\n`;
            info += `╰────────────────────\n\n`;
            info += `Usage: antispam <on/off> [max_commands]`;
            
            return await reply(info);
        }
        
        const setting = args[0].toLowerCase();
        
        if (setting === 'on') {
            bot.security.antiSpam = true;
            if (args[1] && !isNaN(args[1])) {
                bot.security.maxCommands = parseInt(args[1]);
            }
            await reply(`✅ Anti-spam enabled. Max ${bot.security.maxCommands} commands per minute.`);
        } else if (setting === 'off') {
            bot.security.antiSpam = false;
            await reply('❌ Anti-spam disabled.');
        } else {
            await reply('❌ Use "on" or "off"');
        }
    }
});

// Database maintenance
commands.add({
    name: ['dbmaintenance'],
    command: ['dbmaintenance', 'dbclean'],
    category: 'admin',
    desc: 'Perform database maintenance and cleanup',
    owner: true,
    run: async ({ reply }) => {
        try {
            const beforeStats = getStats();
            
            // Clean up inactive users (not seen in 60 days)
            const sixtyDaysAgo = Date.now() - (60 * 24 * 60 * 60 * 1000);
            const users = usersDB.all();
            let cleanedUsers = 0;
            
            for (const [userId, userData] of Object.entries(users)) {
                if (userData.lastSeen < sixtyDaysAgo && !isOwner(userId)) {
                    usersDB.delete(userId);
                    cleanedUsers++;
                }
            }
            
            // Clean up empty groups (if any)
            const groups = groupsDB.all();
            let cleanedGroups = 0;
            
            for (const [groupId, groupData] of Object.entries(groups)) {
                // Basic cleanup - this can be expanded based on needs
                if (!groupData.id) {
                    groupsDB.delete(groupId);
                    cleanedGroups++;
                }
            }
            
            const afterStats = getStats();
            
            let report = `╭─「 *Database Maintenance* 」\n`;
            report += `│ 👥 *Users Before:* ${beforeStats.totalUsers}\n`;
            report += `│ 👥 *Users After:* ${afterStats.totalUsers}\n`;
            report += `│ 🧹 *Users Cleaned:* ${cleanedUsers}\n`;
            report += `│ 🏘️ *Groups Before:* ${beforeStats.totalGroups}\n`;
            report += `│ 🏘️ *Groups After:* ${afterStats.totalGroups}\n`;
            report += `│ 🧹 *Groups Cleaned:* ${cleanedGroups}\n`;
            report += `╰────────────────────\n\n`;
            report += `✅ Database maintenance completed!`;
            
            await reply(report);
        } catch (error) {
            await reply(`❌ Database maintenance failed: ${error.message}`);
        }
    }
});

console.log('✅ Admin commands loaded');
