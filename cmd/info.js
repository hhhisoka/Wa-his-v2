/**
 * Information Commands for Hisoka-md/his-v0
 * Bot information and help utilities
 */

const { commands } = require('../lib/commands.js');
const { bot } = require('../settings.js');
const { getStats } = require('../lib/database.js');
const { Func } = require('../lib/functions.js');

// Bot information command
commands.add({
    name: ['botinfo'],
    command: ['botinfo', 'info'],
    category: 'info',
    desc: 'Display bot information and statistics',
    run: async ({ rav, reply }) => {
        const stats = getStats();
        const uptime = process.uptime();
        
        let info = `╭─「 *${bot.name}* 」\n`;
        info += `│ 📱 *Version:* ${bot.version}\n`;
        info += `│ 👨‍💻 *Creator:* ${bot.creator}\n`;
        info += `│ 📝 *Description:* ${bot.description}\n`;
        info += `│ 💾 *Runtime:* Node.js ${process.version}\n`;
        info += `│ ⏱️ *Uptime:* ${Func.formatTime(uptime * 1000)}\n`;
        info += `│ 👥 *Total Users:* ${stats.totalUsers}\n`;
        info += `│ 🏘️ *Total Groups:* ${stats.totalGroups}\n`;
        info += `│ ⚡ *Commands Used:* ${stats.totalCommands}\n`;
        info += `│ 🤖 *Bot Number:* ${rav.user.id.split(':')[0]}\n`;
        info += `╰────────────────────`;
        
        await reply(info);
    }
});

// Help command
commands.add({
    name: ['help'],
    command: ['help', 'menu'],
    alias: ['h'],
    category: 'info',
    desc: 'Display available commands',
    usage: '[command]',
    example: 'botinfo',
    run: async ({ args, reply }) => {
        if (args[0]) {
            // Show specific command help
            const commandHelp = commands.getCommandHelp(args[0]);
            if (commandHelp) {
                await reply(commandHelp);
            } else {
                await reply('❌ Command not found.');
            }
            return;
        }
        
        // Show all commands by category
        const categories = commands.getCategories();
        const allCommands = commands.getAllCommands({ hidden: false });
        
        let menu = `╭─「 *${bot.name} Commands* 」\n`;
        menu += `│ Total: ${allCommands.length} commands\n`;
        menu += `│ Prefix: ${bot.prefix.join(' ')}\n`;
        menu += `╰────────────────────\n\n`;
        
        for (const category of categories.sort()) {
            const categoryCommands = commands.getByCategory(category).filter(cmd => !cmd.hidden);
            if (categoryCommands.length === 0) continue;
            
            menu += `╭─「 *${Func.capitalizeFirst(category)}* 」\n`;
            
            for (const cmd of categoryCommands) {
                menu += `│ ${bot.prefix[0]}${cmd.command[0]} - ${cmd.desc}\n`;
            }
            
            menu += `╰────────────────────\n\n`;
        }
        
        menu += `Type ${bot.prefix[0]}help <command> for detailed help`;
        
        await reply(menu);
    }
});

// Command statistics
commands.add({
    name: ['stats'],
    command: ['stats', 'statistics'],
    category: 'info',
    desc: 'Display bot usage statistics',
    owner: true,
    run: async ({ reply }) => {
        const stats = getStats();
        const cmdStats = commands.getStats();
        const topCommands = commands.getTopCommands(10);
        
        let statsText = `╭─「 *Bot Statistics* 」\n`;
        statsText += `│ 👥 *Total Users:* ${stats.totalUsers}\n`;
        statsText += `│ 🏘️ *Total Groups:* ${stats.totalGroups}\n`;
        statsText += `│ 🚫 *Blocked Users:* ${stats.blockedUsers}\n`;
        statsText += `│ ⚡ *Total Commands:* ${cmdStats.totalCommands}\n`;
        statsText += `│ 📊 *Commands Used:* ${cmdStats.totalUsage}\n`;
        statsText += `│ ❌ *Command Errors:* ${cmdStats.totalErrors}\n`;
        statsText += `│ ✅ *Success Rate:* ${cmdStats.successRate}%\n`;
        statsText += `╰────────────────────\n\n`;
        
        if (topCommands.length > 0) {
            statsText += `╭─「 *Top Commands* 」\n`;
            for (let i = 0; i < topCommands.length; i++) {
                const cmd = topCommands[i];
                statsText += `│ ${i + 1}. ${cmd.name} (${cmd.usage} uses)\n`;
            }
            statsText += `╰────────────────────`;
        }
        
        await reply(statsText);
    }
});

// Ping command
commands.add({
    name: ['ping'],
    command: ['ping'],
    category: 'info',
    desc: 'Check bot response time',
    run: async ({ reply }) => {
        const start = Date.now();
        const msg = await reply('📡 Pinging...');
        const end = Date.now();
        
        const responseTime = end - start;
        const uptime = process.uptime();
        
        let pingText = `╭─「 *Ping Results* 」\n`;
        pingText += `│ 📡 *Response Time:* ${responseTime}ms\n`;
        pingText += `│ ⏱️ *Uptime:* ${Func.formatTime(uptime * 1000)}\n`;
        pingText += `│ 💾 *Memory Usage:* ${Func.formatSize(process.memoryUsage().heapUsed)}\n`;
        pingText += `╰────────────────────`;
        
        await reply(pingText);
    }
});

// System information
commands.add({
    name: ['system'],
    command: ['system', 'sys'],
    category: 'info',
    desc: 'Display system information',
    owner: true,
    run: async ({ reply }) => {
        const systemInfo = await Func.getSystemInfo();
        const memoryUsage = process.memoryUsage();
        
        let sysInfo = `╭─「 *System Information* 」\n`;
        sysInfo += `│ 🖥️ *Platform:* ${process.platform}\n`;
        sysInfo += `│ 🏗️ *Architecture:* ${process.arch}\n`;
        sysInfo += `│ 💾 *Node Version:* ${process.version}\n`;
        sysInfo += `│ ⏱️ *System Uptime:* ${systemInfo.uptime}\n`;
        sysInfo += `│ 🧠 *Memory Usage:* ${Func.formatSize(memoryUsage.heapUsed)}\n`;
        sysInfo += `│ 📊 *Total Memory:* ${Func.formatSize(memoryUsage.heapTotal)}\n`;
        sysInfo += `│ 💿 *Available Disk:* ${systemInfo.disk}\n`;
        sysInfo += `╰────────────────────`;
        
        await reply(sysInfo);
    }
});

// Command list by category
commands.add({
    name: ['commands'],
    command: ['commands', 'cmdlist'],
    category: 'info',
    desc: 'List all available commands by category',
    usage: '[category]',
    example: 'utility',
    run: async ({ args, reply }) => {
        const categories = commands.getCategories().sort();
        
        if (args[0]) {
            const category = args[0].toLowerCase();
            const categoryCommands = commands.getByCategory(category).filter(cmd => !cmd.hidden);
            
            if (categoryCommands.length === 0) {
                let availableCategories = `❌ Category not found.\n\n*Available categories:*\n`;
                availableCategories += categories.map(cat => `• ${cat}`).join('\n');
                return await reply(availableCategories);
            }
            
            let cmdList = `╭─「 *${Func.capitalizeFirst(category)} Commands* 」\n`;
            for (const cmd of categoryCommands) {
                cmdList += `│ ${bot.prefix[0]}${cmd.command[0]}`;
                if (cmd.usage) cmdList += ` ${cmd.usage}`;
                cmdList += `\n│   ${cmd.desc}\n│\n`;
            }
            cmdList += `╰────────────────────`;
            
            await reply(cmdList);
        } else {
            let categoriesList = `╭─「 *Command Categories* 」\n`;
            for (const category of categories) {
                const count = commands.getByCategory(category).filter(cmd => !cmd.hidden).length;
                categoriesList += `│ ${Func.capitalizeFirst(category)} (${count} commands)\n`;
            }
            categoriesList += `╰────────────────────\n\n`;
            categoriesList += `Use ${bot.prefix[0]}commands <category> to see specific commands`;
            
            await reply(categoriesList);
        }
    }
});

console.log('✅ Info commands loaded');
