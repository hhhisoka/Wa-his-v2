/**
 * Message Handler for Hisoka-md/his-v0
 * Professional message processing and command execution
 */

const chalk = require('chalk');
const { bot, isOwner } = require('../settings.js');
const { commands } = require('./commands.js');
const { addUser, addGroup, updateUser, isUserBlocked } = require('./database.js');
const { getBotInstance, isAdmin, isBotAdmin, sendMessage } = require('./bot-instance.js');
const { Func, dl } = require('./functions.js');

const handleMessage = async ({ messages, type }) => {
    try {
        if (type !== 'notify') return;
        
        for (const message of messages) {
            await processMessage(message);
        }
    } catch (error) {
        console.error(chalk.red('❌ Message handling error:'), error);
    }
};

const processMessage = async (m) => {
    try {
        // Skip invalid messages
        if (!m.message || m.key.fromMe) return;
        
        // Extract message info
        const messageInfo = extractMessageInfo(m);
        if (!messageInfo) return;
        
        const { text, sender, isGroup, groupId, messageType } = messageInfo;
        
        // Add user/group to database
        addUser(sender);
        if (isGroup) addGroup(groupId);
        
        // Update user activity
        updateUser(sender, { lastSeen: Date.now() });
        
        // Check if user is blocked
        if (isUserBlocked(sender)) {
            console.log(chalk.yellow(`🚫 Blocked user tried to use bot: ${sender}`));
            return;
        }
        
        // Check for commands
        if (text && isCommand(text)) {
            await handleCommand(m, messageInfo);
        }
        
        // Log message (optional, for debugging)
        if (process.env.NODE_ENV === 'development') {
            console.log(chalk.gray(`📩 ${isGroup ? 'Group' : 'Private'}: ${text?.substring(0, 50)}...`));
        }
        
    } catch (error) {
        console.error(chalk.red('❌ Process message error:'), error);
    }
};

const extractMessageInfo = (m) => {
    try {
        const messageContent = m.message;
        const sender = m.key.remoteJid?.endsWith('@g.us') ? m.key.participant : m.key.remoteJid;
        const isGroup = m.key.remoteJid?.endsWith('@g.us');
        const groupId = isGroup ? m.key.remoteJid : null;
        
        // Extract text from different message types
        let text = '';
        let messageType = 'text';
        
        if (messageContent.conversation) {
            text = messageContent.conversation;
        } else if (messageContent.extendedTextMessage?.text) {
            text = messageContent.extendedTextMessage.text;
        } else if (messageContent.imageMessage?.caption) {
            text = messageContent.imageMessage.caption;
            messageType = 'image';
        } else if (messageContent.videoMessage?.caption) {
            text = messageContent.videoMessage.caption;
            messageType = 'video';
        } else if (messageContent.documentMessage?.caption) {
            text = messageContent.documentMessage.caption;
            messageType = 'document';
        } else if (messageContent.audioMessage) {
            messageType = 'audio';
        } else if (messageContent.stickerMessage) {
            messageType = 'sticker';
        }
        
        return {
            text: text.trim(),
            sender,
            isGroup,
            groupId,
            messageType,
            message: m
        };
    } catch (error) {
        console.error(chalk.red('❌ Extract message info error:'), error);
        return null;
    }
};

const isCommand = (text) => {
    return bot.prefix.some(prefix => text.startsWith(prefix));
};

const handleCommand = async (m, messageInfo) => {
    try {
        const { text, sender, isGroup, groupId } = messageInfo;
        
        // Parse command
        const prefix = bot.prefix.find(p => text.startsWith(p));
        const commandText = text.slice(prefix.length).trim();
        const [commandName, ...args] = commandText.split(' ');
        
        // Find command
        const command = commands.findCommand(commandName);
        if (!command) {
            // Silent fail for non-existent commands
            return;
        }
        
        // Check if command is enabled
        if (!command.enable) {
            return await reply(m, '❌ This command is currently disabled.');
        }
        
        // Check cooldown
        if (commands.checkCooldown(command.name[0], sender)) {
            const remaining = commands.getRemainingCooldown(command.name[0], sender);
            const seconds = Math.ceil(remaining / 1000);
            return await reply(m, `⏳ Please wait ${seconds} seconds before using this command again.`);
        }
        
        // Check permissions
        const permissionCheck = await checkPermissions(command, sender, isGroup, groupId);
        if (!permissionCheck.allowed) {
            return await reply(m, permissionCheck.message);
        }
        
        // Check if text is required
        if (command.query && (!args.length || !args.join(' ').trim())) {
            let usage = `❌ Text required!\n\n`;
            usage += `📝 Usage: ${prefix}${command.command[0]}`;
            if (command.usage) usage += ` ${command.usage}`;
            if (command.example) usage += `\n📖 Example: ${prefix}${command.command[0]} ${command.example}`;
            return await reply(m, usage);
        }
        
        // Set cooldown
        commands.setCooldown(command.name[0], sender);
        
        // Prepare command context
        const context = {
            rav,
            m,
            args,
            text: args.join(' '),
            sender,
            isGroup,
            groupId,
            command,
            prefix,
            Func,
            dl,
            reply: (content) => reply(m, content),
            react: (emoji) => react(m, emoji)
        };
        
        // Execute command
        console.log(chalk.blue(`⚡ Command executed: ${command.name[0]} by ${sender}`));
        
        try {
            await command.run(context);
            commands.incrementUsage(command.name[0]);
            updateUser(sender, { commandsUsed: (getUser(sender)?.commandsUsed || 0) + 1 });
        } catch (error) {
            console.error(chalk.red(`❌ Command execution error (${command.name[0]}):`), error);
            commands.incrementError(command.name[0]);
            await reply(m, `❌ An error occurred while executing this command: ${error.message}`);
        }
        
    } catch (error) {
        console.error(chalk.red('❌ Handle command error:'), error);
        await reply(m, '❌ An unexpected error occurred.');
    }
};

const checkPermissions = async (command, sender, isGroup, groupId) => {
    // Owner only
    if (command.owner && !isOwner(sender)) {
        return { allowed: false, message: bot.messages.ownerOnly };
    }
    
    // Group only
    if (command.group && !isGroup) {
        return { allowed: false, message: bot.messages.groupOnly };
    }
    
    // Private only
    if (command.private && isGroup) {
        return { allowed: false, message: bot.messages.privateOnly };
    }
    
    // Admin only (group)
    if (command.admin && isGroup) {
        const userIsAdmin = await isAdmin(groupId, sender);
        if (!userIsAdmin && !isOwner(sender)) {
            return { allowed: false, message: bot.messages.adminOnly };
        }
    }
    
    // Bot admin required
    if (command.botAdmin && isGroup) {
        const botIsAdmin = await isBotAdmin(groupId);
        if (!botIsAdmin) {
            return { allowed: false, message: bot.messages.botAdminRequired };
        }
    }
    
    return { allowed: true };
};

// Helper functions
const reply = async (m, content) => {
    try {
        const jid = m.key.remoteJid;
        const options = { quoted: m };
        
        if (typeof content === 'string') {
            await sendMessage(jid, { text: content }, options);
        } else {
            await sendMessage(jid, content, options);
        }
    } catch (error) {
        console.error(chalk.red('❌ Reply error:'), error);
    }
};

const react = async (m, emoji) => {
    try {
        await sendMessage(m.key.remoteJid, {
            react: {
                text: emoji,
                key: m.key
            }
        });
    } catch (error) {
        console.error(chalk.red('❌ React error:'), error);
    }
};

console.log(chalk.green('📨 Message handler initialized'));

module.exports = { handleMessage };
