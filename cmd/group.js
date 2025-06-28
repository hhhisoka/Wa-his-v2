/**
 * Group Management Commands for Hisoka-md/his-v0
 * Professional group administration utilities
 */

const { commands } = require('../lib/commands.js');
const { getGroup, setGroupSetting, getGroupSetting } = require('../lib/database.js');
const { getBotInstance, getGroupMetadata, isAdmin, isBotAdmin } = require('../lib/bot-instance.js');
const { Func } = require('../lib/functions.js');

// Group information
commands.add({
    name: ['groupinfo'],
    command: ['groupinfo', 'gcinfo'],
    alias: ['ginfo'],
    category: 'group',
    desc: 'Display group information',
    group: true,
    run: async ({ rav, m, reply }) => {
        try {
            const groupId = m.key.remoteJid;
            const metadata = await getGroupMetadata(groupId);
            
            if (!metadata) {
                return await reply('❌ Failed to get group information.');
            }
            
            const groupData = getGroup(groupId);
            const adminCount = metadata.participants.filter(p => p.admin).length;
            const memberCount = metadata.participants.length;
            
            let info = `╭─「 *Group Information* 」\n`;
            info += `│ 🏷️ *Name:* ${metadata.subject}\n`;
            info += `│ 📝 *Description:* ${metadata.desc || 'No description'}\n`;
            info += `│ 👥 *Members:* ${memberCount}\n`;
            info += `│ 👑 *Admins:* ${adminCount}\n`;
            info += `│ 📅 *Created:* ${new Date(metadata.creation * 1000).toLocaleDateString()}\n`;
            info += `│ 🆔 *Group ID:* ${groupId}\n`;
            info += `│ 🤖 *Bot Added:* ${groupData ? new Date(groupData.added).toLocaleDateString() : 'Unknown'}\n`;
            info += `╰────────────────────`;
            
            await reply(info);
        } catch (error) {
            await reply(`❌ Error getting group info: ${error.message}`);
        }
    }
});

// List group members
commands.add({
    name: ['members'],
    command: ['members', 'memberlist'],
    alias: ['list'],
    category: 'group',
    desc: 'List all group members',
    group: true,
    run: async ({ rav, m, reply }) => {
        try {
            const groupId = m.key.remoteJid;
            const metadata = await getGroupMetadata(groupId);
            
            if (!metadata) {
                return await reply('❌ Failed to get member list.');
            }
            
            const admins = metadata.participants.filter(p => p.admin);
            const members = metadata.participants.filter(p => !p.admin);
            
            let memberList = `╭─「 *${metadata.subject}* 」\n`;
            memberList += `│ 👥 Total: ${metadata.participants.length} members\n`;
            memberList += `╰────────────────────\n\n`;
            
            if (admins.length > 0) {
                memberList += `╭─「 *Admins (${admins.length})* 」\n`;
                for (let i = 0; i < admins.length; i++) {
                    const admin = admins[i];
                    const number = admin.id.split('@')[0];
                    memberList += `│ ${i + 1}. @${number}\n`;
                }
                memberList += `╰────────────────────\n\n`;
            }
            
            if (members.length > 0) {
                memberList += `╭─「 *Members (${members.length})* 」\n`;
                const chunks = Func.chunkArray(members, 20); // Show 20 members per chunk
                
                for (let i = 0; i < chunks[0].length; i++) {
                    const member = chunks[0][i];
                    const number = member.id.split('@')[0];
                    memberList += `│ ${i + 1}. @${number}\n`;
                }
                
                if (chunks.length > 1) {
                    memberList += `│ ... and ${members.length - 20} more members\n`;
                }
                memberList += `╰────────────────────`;
            }
            
            // Mention all members
            const mentions = metadata.participants.map(p => p.id);
            
            await getBotInstance().sendMessage(m.key.remoteJid, {
                text: memberList,
                mentions: mentions
            });
        } catch (error) {
            await reply(`❌ Error getting member list: ${error.message}`);
        }
    }
});

// Kick member
commands.add({
    name: ['kick'],
    command: ['kick'],
    category: 'group',
    desc: 'Remove member from group',
    usage: '<@user|reply>',
    example: '@628xxxxxxxxx',
    group: true,
    admin: true,
    botAdmin: true,
    run: async ({ args, rav, m, reply }) => {
        try {
            let targetId;
            
            // Check if replying to a message
            if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                targetId = m.message.extendedTextMessage.contextInfo.participant;
            } else if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
                targetId = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
            } else if (args[0]) {
                targetId = args[0].replace(/[^\d]/g, '') + '@s.whatsapp.net';
            } else {
                return await reply('❌ Please mention a user or reply to their message.');
            }
            
            const groupId = m.key.remoteJid;
            
            // Check if target is admin
            const isTargetAdmin = await isAdmin(groupId, targetId);
            if (isTargetAdmin) {
                return await reply('❌ Cannot kick group admin.');
            }
            
            await getBotInstance().groupParticipantsUpdate(groupId, [targetId], 'remove');
            await reply(`✅ Successfully removed @${targetId.split('@')[0]} from the group.`);
            
        } catch (error) {
            await reply(`❌ Failed to kick member: ${error.message}`);
        }
    }
});

// Add member
commands.add({
    name: ['add'],
    command: ['add'],
    category: 'group',
    desc: 'Add member to group',
    usage: '<number>',
    example: '628xxxxxxxxx',
    group: true,
    admin: true,
    botAdmin: true,
    run: async ({ args, rav, m, reply }) => {
        try {
            if (!args[0]) {
                return await reply('❌ Please provide a phone number.');
            }
            
            const number = args[0].replace(/[^\d]/g, '');
            const targetId = number + '@s.whatsapp.net';
            const groupId = m.key.remoteJid;
            
            const result = await getBotInstance().groupParticipantsUpdate(groupId, [targetId], 'add');
            
            if (result[0].status === '200') {
                await reply(`✅ Successfully added @${number} to the group.`);
            } else {
                await reply(`❌ Failed to add member: ${result[0].status}`);
            }
            
        } catch (error) {
            await reply(`❌ Failed to add member: ${error.message}`);
        }
    }
});

// Promote to admin
commands.add({
    name: ['promote'],
    command: ['promote'],
    category: 'group',
    desc: 'Promote member to admin',
    usage: '<@user|reply>',
    example: '@628xxxxxxxxx',
    group: true,
    admin: true,
    botAdmin: true,
    run: async ({ args, rav, m, reply }) => {
        try {
            let targetId;
            
            if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                targetId = m.message.extendedTextMessage.contextInfo.participant;
            } else if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
                targetId = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
            } else if (args[0]) {
                targetId = args[0].replace(/[^\d]/g, '') + '@s.whatsapp.net';
            } else {
                return await reply('❌ Please mention a user or reply to their message.');
            }
            
            const groupId = m.key.remoteJid;
            
            await getBotInstance().groupParticipantsUpdate(groupId, [targetId], 'promote');
            await reply(`✅ Successfully promoted @${targetId.split('@')[0]} to admin.`);
            
        } catch (error) {
            await reply(`❌ Failed to promote member: ${error.message}`);
        }
    }
});

// Demote admin
commands.add({
    name: ['demote'],
    command: ['demote'],
    category: 'group',
    desc: 'Demote admin to member',
    usage: '<@user|reply>',
    example: '@628xxxxxxxxx',
    group: true,
    admin: true,
    botAdmin: true,
    run: async ({ args, rav, m, reply }) => {
        try {
            let targetId;
            
            if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                targetId = m.message.extendedTextMessage.contextInfo.participant;
            } else if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
                targetId = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
            } else if (args[0]) {
                targetId = args[0].replace(/[^\d]/g, '') + '@s.whatsapp.net';
            } else {
                return await reply('❌ Please mention a user or reply to their message.');
            }
            
            const groupId = m.key.remoteJid;
            
            await getBotInstance().groupParticipantsUpdate(groupId, [targetId], 'demote');
            await reply(`✅ Successfully demoted @${targetId.split('@')[0]} to member.`);
            
        } catch (error) {
            await reply(`❌ Failed to demote admin: ${error.message}`);
        }
    }
});

// Change group subject
commands.add({
    name: ['setname'],
    command: ['setname', 'setsubject'],
    category: 'group',
    desc: 'Change group name',
    usage: '<new_name>',
    example: 'My Awesome Group',
    group: true,
    admin: true,
    botAdmin: true,
    query: true,
    run: async ({ args, rav, m, reply }) => {
        try {
            const newName = args.join(' ');
            const groupId = m.key.remoteJid;
            
            await getBotInstance().groupUpdateSubject(groupId, newName);
            await reply(`✅ Group name changed to: ${newName}`);
            
        } catch (error) {
            await reply(`❌ Failed to change group name: ${error.message}`);
        }
    }
});

// Change group description
commands.add({
    name: ['setdesc'],
    command: ['setdesc', 'setdescription'],
    category: 'group',
    desc: 'Change group description',
    usage: '<new_description>',
    example: 'This is our group description',
    group: true,
    admin: true,
    botAdmin: true,
    query: true,
    run: async ({ args, rav, m, reply }) => {
        try {
            const newDesc = args.join(' ');
            const groupId = m.key.remoteJid;
            
            await getBotInstance().groupUpdateDescription(groupId, newDesc);
            await reply(`✅ Group description updated.`);
            
        } catch (error) {
            await reply(`❌ Failed to change group description: ${error.message}`);
        }
    }
});

// Group settings
commands.add({
    name: ['groupsetting'],
    command: ['groupsetting', 'gsetting'],
    category: 'group',
    desc: 'Manage group settings',
    usage: '<setting> <on/off>',
    example: 'antilink on',
    group: true,
    admin: true,
    run: async ({ args, reply, groupId }) => {
        if (!args[0]) {
            const settings = getGroup(groupId)?.settings || {};
            
            let settingsText = `╭─「 *Group Settings* 」\n`;
            settingsText += `│ 🔗 *Anti-link:* ${settings.antilink ? 'ON' : 'OFF'}\n`;
            settingsText += `│ 🚫 *Anti-spam:* ${settings.antispam ? 'ON' : 'OFF'}\n`;
            settingsText += `│ ⚡ *Commands:* ${settings.commands ? 'ON' : 'OFF'}\n`;
            settingsText += `╰────────────────────\n\n`;
            settingsText += `Use: groupsetting <setting> <on/off>`;
            
            return await reply(settingsText);
        }
        
        const setting = args[0].toLowerCase();
        const value = args[1]?.toLowerCase();
        
        if (!value || !['on', 'off'].includes(value)) {
            return await reply('❌ Please specify on or off.');
        }
        
        const validSettings = ['antilink', 'antispam', 'commands'];
        if (!validSettings.includes(setting)) {
            return await reply(`❌ Invalid setting. Available: ${validSettings.join(', ')}`);
        }
        
        const boolValue = value === 'on';
        setGroupSetting(groupId, setting, boolValue);
        
        await reply(`✅ ${Func.capitalizeFirst(setting)} has been turned ${value}.`);
    }
});

// Lock/unlock group (messages only from admins)
commands.add({
    name: ['lock'],
    command: ['lock'],
    category: 'group',
    desc: 'Lock group (only admins can send messages)',
    group: true,
    admin: true,
    botAdmin: true,
    run: async ({ rav, m, reply }) => {
        try {
            const groupId = m.key.remoteJid;
            await getBotInstance().groupSettingUpdate(groupId, 'announcement');
            await reply('🔒 Group locked. Only admins can send messages.');
        } catch (error) {
            await reply(`❌ Failed to lock group: ${error.message}`);
        }
    }
});

// Unlock group
commands.add({
    name: ['unlock'],
    command: ['unlock'],
    category: 'group',
    desc: 'Unlock group (all members can send messages)',
    group: true,
    admin: true,
    botAdmin: true,
    run: async ({ rav, m, reply }) => {
        try {
            const groupId = m.key.remoteJid;
            await getBotInstance().groupSettingUpdate(groupId, 'not_announcement');
            await reply('🔓 Group unlocked. All members can send messages.');
        } catch (error) {
            await reply(`❌ Failed to unlock group: ${error.message}`);
        }
    }
});

// Leave group
commands.add({
    name: ['leave'],
    command: ['leave'],
    category: 'group',
    desc: 'Make bot leave the group',
    group: true,
    admin: true,
    run: async ({ rav, m, reply }) => {
        await reply('👋 Goodbye! Thanks for using Hisoka-md/his-v0');
        setTimeout(async () => {
            await getBotInstance().groupLeave(m.key.remoteJid);
        }, 2000);
    }
});

console.log('✅ Group commands loaded');
