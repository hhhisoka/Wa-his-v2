/**
 * Utility Commands for Hisoka-md/his-v0
 * Essential utility functions for daily use
 */

const { commands } = require('../lib/commands.js');
const { Func } = require('../lib/functions.js');
const axios = require('axios');

// URL shortener
commands.add({
    name: ['shorturl'],
    command: ['shorturl', 'short'],
    category: 'utility',
    desc: 'Shorten a URL',
    usage: '<url>',
    example: 'https://github.com/hhhisoka/Hisoka-Bot',
    query: true,
    run: async ({ args, reply }) => {
        try {
            const url = args[0];
            
            if (!Func.isUrl(url)) {
                return await reply('❌ Please provide a valid URL.');
            }
            
            // Using tinyurl.com API
            const response = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
            const shortUrl = response.data;
            
            let result = `╭─「 *URL Shortener* 」\n`;
            result += `│ 🔗 *Original:* ${url}\n`;
            result += `│ ⚡ *Shortened:* ${shortUrl}\n`;
            result += `╰────────────────────`;
            
            await reply(result);
        } catch (error) {
            await reply(`❌ Error shortening URL: ${error.message}`);
        }
    }
});

// QR Code generator
commands.add({
    name: ['qrcode'],
    command: ['qrcode', 'qr'],
    category: 'utility',
    desc: 'Generate QR code from text',
    usage: '<text>',
    example: 'Hello World',
    query: true,
    run: async ({ args, rav, m, reply }) => {
        try {
            const text = args.join(' ');
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(text)}`;
            
            await rav.sendMessage(m.key.remoteJid, {
                image: { url: qrUrl },
                caption: `📱 *QR Code Generated*\n\n🔤 *Text:* ${text}`
            });
        } catch (error) {
            await reply(`❌ Error generating QR code: ${error.message}`);
        }
    }
});

// Calculate
commands.add({
    name: ['calc'],
    command: ['calc', 'calculate'],
    category: 'utility',
    desc: 'Calculate mathematical expressions',
    usage: '<expression>',
    example: '2 + 2 * 3',
    query: true,
    run: async ({ args, reply }) => {
        try {
            const expression = args.join(' ');
            
            // Basic security check
            if (/[a-zA-Z]/.test(expression.replace(/\s/g, ''))) {
                return await reply('❌ Only numbers and mathematical operators are allowed.');
            }
            
            // Replace common symbols
            const cleanExpression = expression
                .replace(/×/g, '*')
                .replace(/÷/g, '/')
                .replace(/,/g, '');
            
            const result = Function(`"use strict"; return (${cleanExpression})`)();
            
            if (isNaN(result) || !isFinite(result)) {
                return await reply('❌ Invalid mathematical expression.');
            }
            
            let calcResult = `╭─「 *Calculator* 」\n`;
            calcResult += `│ 🔢 *Expression:* ${expression}\n`;
            calcResult += `│ ✅ *Result:* ${result}\n`;
            calcResult += `╰────────────────────`;
            
            await reply(calcResult);
        } catch (error) {
            await reply('❌ Invalid mathematical expression.');
        }
    }
});

// Base64 encode/decode
commands.add({
    name: ['base64'],
    command: ['base64'],
    category: 'utility',
    desc: 'Encode or decode base64 text',
    usage: '<encode/decode> <text>',
    example: 'encode Hello World',
    run: async ({ args, reply }) => {
        if (args.length < 2) {
            return await reply('❌ Usage: base64 <encode/decode> <text>');
        }
        
        const action = args[0].toLowerCase();
        const text = args.slice(1).join(' ');
        
        try {
            let result;
            if (action === 'encode') {
                result = Buffer.from(text).toString('base64');
            } else if (action === 'decode') {
                result = Buffer.from(text, 'base64').toString('utf8');
            } else {
                return await reply('❌ Action must be either "encode" or "decode"');
            }
            
            let output = `╭─「 *Base64 ${Func.capitalizeFirst(action)}* 」\n`;
            output += `│ 📝 *Input:* ${text}\n`;
            output += `│ ✅ *Output:* ${result}\n`;
            output += `╰────────────────────`;
            
            await reply(output);
        } catch (error) {
            await reply(`❌ Error ${action}ing base64: Invalid input`);
        }
    }
});

// Hash generator
commands.add({
    name: ['hash'],
    command: ['hash'],
    category: 'utility',
    desc: 'Generate hash from text',
    usage: '<algorithm> <text>',
    example: 'md5 Hello World',
    run: async ({ args, reply }) => {
        if (args.length < 2) {
            return await reply('❌ Usage: hash <md5/sha1/sha256> <text>');
        }
        
        const algorithm = args[0].toLowerCase();
        const text = args.slice(1).join(' ');
        
        const validAlgorithms = ['md5', 'sha1', 'sha256'];
        if (!validAlgorithms.includes(algorithm)) {
            return await reply(`❌ Supported algorithms: ${validAlgorithms.join(', ')}`);
        }
        
        try {
            const crypto = await import('crypto');
            const hash = crypto.createHash(algorithm).update(text).digest('hex');
            
            let result = `╭─「 *Hash Generator* 」\n`;
            result += `│ 🔐 *Algorithm:* ${algorithm.toUpperCase()}\n`;
            result += `│ 📝 *Input:* ${text}\n`;
            result += `│ ✅ *Hash:* ${hash}\n`;
            result += `╰────────────────────`;
            
            await reply(result);
        } catch (error) {
            await reply(`❌ Error generating hash: ${error.message}`);
        }
    }
});

// Text case converter
commands.add({
    name: ['textcase'],
    command: ['textcase', 'case'],
    category: 'utility',
    desc: 'Convert text case',
    usage: '<upper/lower/title/camel> <text>',
    example: 'upper hello world',
    run: async ({ args, reply }) => {
        if (args.length < 2) {
            return await reply('❌ Usage: textcase <upper/lower/title/camel> <text>');
        }
        
        const caseType = args[0].toLowerCase();
        const text = args.slice(1).join(' ');
        
        let result;
        switch (caseType) {
            case 'upper':
                result = text.toUpperCase();
                break;
            case 'lower':
                result = text.toLowerCase();
                break;
            case 'title':
                result = Func.titleCase(text);
                break;
            case 'camel':
                result = text.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
                    return index === 0 ? word.toLowerCase() : word.toUpperCase();
                }).replace(/\s+/g, '');
                break;
            default:
                return await reply('❌ Valid types: upper, lower, title, camel');
        }
        
        let output = `╭─「 *Text Case Converter* 」\n`;
        output += `│ 🔤 *Type:* ${Func.capitalizeFirst(caseType)}\n`;
        output += `│ 📝 *Input:* ${text}\n`;
        output += `│ ✅ *Output:* ${result}\n`;
        output += `╰────────────────────`;
        
        await reply(output);
    }
});

// Random string generator
commands.add({
    name: ['randomstring'],
    command: ['randomstring', 'randstr'],
    category: 'utility',
    desc: 'Generate random string',
    usage: '[length]',
    example: '16',
    run: async ({ args, reply }) => {
        const length = parseInt(args[0]) || 10;
        
        if (length < 1 || length > 100) {
            return await reply('❌ Length must be between 1 and 100.');
        }
        
        const randomStr = Func.randomString(length);
        
        let result = `╭─「 *Random String Generator* 」\n`;
        result += `│ 📏 *Length:* ${length}\n`;
        result += `│ 🎲 *Generated:* \`${randomStr}\`\n`;
        result += `╰────────────────────`;
        
        await reply(result);
    }
});

// Word count
commands.add({
    name: ['wordcount'],
    command: ['wordcount', 'wc'],
    category: 'utility',
    desc: 'Count words, characters, and lines in text',
    usage: '<text>',
    example: 'Hello world, this is a test',
    query: true,
    run: async ({ args, reply }) => {
        const text = args.join(' ');
        
        const words = text.trim().split(/\s+/).length;
        const characters = text.length;
        const charactersNoSpaces = text.replace(/\s/g, '').length;
        const lines = text.split('\n').length;
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
        
        let result = `╭─「 *Text Analysis* 」\n`;
        result += `│ 📝 *Words:* ${words}\n`;
        result += `│ 🔤 *Characters:* ${characters}\n`;
        result += `│ 🔡 *Characters (no spaces):* ${charactersNoSpaces}\n`;
        result += `│ 📄 *Lines:* ${lines}\n`;
        result += `│ ✏️ *Sentences:* ${sentences}\n`;
        result += `╰────────────────────`;
        
        await reply(result);
    }
});

// URL information
commands.add({
    name: ['urlinfo'],
    command: ['urlinfo', 'checkurl'],
    category: 'utility',
    desc: 'Get information about a URL',
    usage: '<url>',
    example: 'https://github.com',
    query: true,
    run: async ({ args, reply }) => {
        try {
            const url = args[0];
            
            if (!Func.isUrl(url)) {
                return await reply('❌ Please provide a valid URL.');
            }
            
            const response = await axios.head(url, {
                timeout: 10000,
                maxRedirects: 5
            });
            
            const headers = response.headers;
            const contentType = headers['content-type'] || 'Unknown';
            const contentLength = headers['content-length'] || 'Unknown';
            const server = headers['server'] || 'Unknown';
            const lastModified = headers['last-modified'] || 'Unknown';
            
            let info = `╭─「 *URL Information* 」\n`;
            info += `│ 🔗 *URL:* ${url}\n`;
            info += `│ ✅ *Status:* ${response.status} ${response.statusText}\n`;
            info += `│ 📄 *Content Type:* ${contentType}\n`;
            info += `│ 📏 *Content Length:* ${contentLength === 'Unknown' ? contentLength : Func.formatSize(parseInt(contentLength))}\n`;
            info += `│ 🖥️ *Server:* ${server}\n`;
            info += `│ 📅 *Last Modified:* ${lastModified}\n`;
            info += `╰────────────────────`;
            
            await reply(info);
        } catch (error) {
            await reply(`❌ Error checking URL: ${error.message}`);
        }
    }
});

// Timestamp converter
commands.add({
    name: ['timestamp'],
    command: ['timestamp', 'time'],
    category: 'utility',
    desc: 'Convert timestamp or get current timestamp',
    usage: '[timestamp]',
    example: '1640995200',
    run: async ({ args, reply }) => {
        try {
            let result = `╭─「 *Timestamp Converter* 」\n`;
            
            if (args[0]) {
                const timestamp = parseInt(args[0]);
                if (isNaN(timestamp)) {
                    return await reply('❌ Invalid timestamp format.');
                }
                
                // Convert to milliseconds if needed
                const date = new Date(timestamp.toString().length === 10 ? timestamp * 1000 : timestamp);
                
                result += `│ 🕐 *Timestamp:* ${timestamp}\n`;
                result += `│ 📅 *Date:* ${date.toDateString()}\n`;
                result += `│ ⏰ *Time:* ${date.toTimeString()}\n`;
                result += `│ 🌍 *ISO:* ${date.toISOString()}\n`;
            } else {
                const now = new Date();
                const timestamp = Math.floor(now.getTime() / 1000);
                
                result += `│ 📅 *Current Date:* ${now.toDateString()}\n`;
                result += `│ ⏰ *Current Time:* ${now.toTimeString()}\n`;
                result += `│ 🕐 *Timestamp:* ${timestamp}\n`;
                result += `│ 🌍 *ISO:* ${now.toISOString()}\n`;
            }
            
            result += `╰────────────────────`;
            await reply(result);
        } catch (error) {
            await reply(`❌ Error processing timestamp: ${error.message}`);
        }
    }
});

console.log('✅ Utility commands loaded');
