const fs = require('fs');
const path = require('path');
const { makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const chalk = require('chalk');
const readline = require('readline');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const { setBotInstance, getBotInstance } = require('./bot-instance.js');

const bot = {
    name: 'Hisoka-md/his-v0',
    version: '1.0.0',
    creator: '@hhhisoka',
    description: 'Professional WhatsApp utility bot focused on essential features',
    number: process.env.BOT_NUMBER || '628000000000',
    prefix: process.env.PREFIX || '.',
    mode: 'public',
    owner: ['628000000000'],
    database: {
        users: new Map(),
        groups: new Map(),
        settings: new Map()
    },
    media: {
        maxSize: 50 * 1024 * 1024,
        allowedTypes: ['image', 'video', 'audio', 'document'],
        tempDir: './temp'
    },
    security: {
        antiSpam: true,
        cooldown: 3000,
        maxCommands: 20,
        blockedUsers: new Set()
    },
    features: {
        groupManagement: true,
        userManagement: true,
        mediaProcessing: true,
        fileConverter: true,
        systemInfo: true,
        games: false,
        fun: false,
        entertainment: false,
        economy: false,
        leveling: false
    },
    apis: {},
    images: {
        profile: 'https://telegra.ph/file/8cc9fc8c25b8d9cd60e5e.jpg',
        menu: 'https://telegra.ph/file/b0f56b3b4b7bb6dd5b6e8.jpg',
        error: 'https://telegra.ph/file/c7b6b8f5d4c5e8f9a0b1c.jpg',
        success: 'https://telegra.ph/file/d8c9f0a1b2c3d4e5f6g7h.jpg',
        welcome: 'https://telegra.ph/file/e9d0a1b2c3d4e5f6g7h8i.jpg',
        sticker: 'https://telegra.ph/file/f0e1b2c3d4e5f6g7h8i9j.jpg'
    },
    sticker: {
        packname: 'Hisoka-md/his-v0',
        author: '@hhhisoka',
        quality: 100
    },
    messages: {
        ownerOnly: '❌ This command is restricted to bot owners only.',
        adminOnly: '❌ This command requires admin privileges.',
        groupOnly: '❌ This command can only be used in groups.',
        privateOnly: '❌ This command can only be used in private chat.',
        botAdminRequired: '❌ Bot needs admin privileges to execute this command.',
        cooldown: '⏳ Please wait before using this command again.',
        error: '❌ An error occurred while processing your request.',
        processing: '⏳ Processing your request...',
        success: '✅ Command executed successfully.',
        invalidInput: '❌ Invalid input. Please check the command usage.',
        notFound: '❌ Resource not found.',
        maintenance: '🔧 This feature is currently under maintenance.'
    },
    timezone: 'Asia/Jakarta',
    session: {
        folder: './session',
        filename: 'hisoka-session'
    }
};

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (text) => new Promise((resolve) => rl.question(text, resolve));

const startConnection = async () => {
    try {
        const sessionPath = path.resolve(bot.session.folder);
        if (!fs.existsSync(sessionPath)) {
            fs.mkdirSync(sessionPath, { recursive: true });
        }
        
        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
        const { version, isLatest } = await fetchLatestBaileysVersion();
        
        console.log(chalk.blue(`📱 Using WhatsApp Web v${version.join('.')}, isLatest : ${isLatest}`));
        
        const connectionOptions = {
            version,
            printQRInTerminal: false,
            auth: state,
            browser: ['Hisoka-md/his-v0', 'Chrome', '1.0.0'],
            logger: pino({ level: 'silent' }),
            generateHighQualityLinkPreview: true,
            markOnlineOnConnect: false,
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: 60000,
            keepAliveIntervalMs: 30000,
            retryRequestDelayMs: 2000
        };
        
        const rav = makeWASocket(connectionOptions);
        setBotInstance(rav);
        
        let pairingCodeRequested = false;
        
        rav.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (connection === 'connecting' && !rav.authState.creds.registered && !pairingCodeRequested) {
                pairingCodeRequested = true;
                
                console.log(chalk.cyan('🔗 Choose connection method :'));
                console.log(chalk.yellow('1. QR Code (scan with camera)'));
                console.log(chalk.yellow('2. Pairing Code (enter 8-digit code)'));
                
                const choice = await question(chalk.cyan('📱 Enter your choice (1 or 2) : '));
                
                if (choice.trim() === '1') {
                    console.log(chalk.cyan('📱 QR Code method selected'));
                    console.log(chalk.yellow('📱 Scan the QR code below with your WhatsApp app'));
                    
                    const qrOptions = { ...connectionOptions, printQRInTerminal: true };
                    const newRav = makeWASocket(qrOptions);
                    setBotInstance(newRav);
                    
                    newRav.ev.on('connection.update', handleConnectionUpdate);
                    newRav.ev.on('creds.update', saveCreds);
                    const { handleMessage } = require('./message.js');
                    newRav.ev.on('messages.upsert', handleMessage);
                    newRav.ev.on('group-participants.update', handleGroupUpdate);
                    
                } else if (choice.trim() === '2') {
                    console.log(chalk.cyan('🔗 Pairing code method selected'));
                    
                    try {
                        const phoneNumber = await question(chalk.cyan('📱 Enter your WhatsApp number (with country code, example : +33123456789) :'));
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        const code = await rav.requestPairingCode(phoneNumber.trim());
                        
                        console.log(chalk.green(`🔐 Pairing code : ${code}`));
                        console.log(chalk.yellow(`📱 Go to WhatsApp > Settings > Linked Devices > Link a Device`));
                        console.log(chalk.yellow(`📱 Choose "Link with phone number" and enter this code: ${code}`));
                        
                    } catch (error) {
                        console.error(chalk.red(`❌ Error generating pairing code: ${error.message}`));
                        console.log(chalk.yellow(`🔄 Restarting connection...`));
                        pairingCodeRequested = false;
                        setTimeout(() => startConnection(), 3000);
                    }
                } else {
                    console.log(chalk.red(`❌ Invalid choice. Defaulting to QR code method...`));
                    pairingCodeRequested = false;
                    setTimeout(() => startConnection(), 2000);
                }
            }
            
            handleConnectionUpdate(update, () => {
                pairingCodeRequested = true; // Stop other prompts
            });
        });
        
        const { handleMessage } = require('./message.js');
        rav.ev.on('creds.update', saveCreds);
        rav.ev.on('messages.upsert', handleMessage);
        rav.ev.on('group-participants.update', handleGroupUpdate);
        
        return rav;
    } catch (err) {
        console.error(chalk.red('❌ Unhandled error in startConnection:'), err);
        console.log(chalk.yellow('🔁 Retrying in 10 seconds...'));
        setTimeout(() => startConnection(), 10000);
    }
};

const handleConnectionUpdate = (update, onSuccess = () => {}) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
        console.log(chalk.yellow(`📱 QR Code generated, scan with WhatsApp`));
        console.log(chalk.cyan(`📱 QR Code:`));
        qrcode.generate(qr, { small: true });
        console.log(chalk.yellow(`📱 Scan this QR code with your WhatsApp app`));
    }
    
    if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const reason = lastDisconnect?.error?.message || 'Unknown';
        
        console.log(chalk.red(`❌ Connection closed with reason: ${reason}`));
        console.log(chalk.yellow(`📉 Status Code: ${statusCode}`));
        
        if (statusCode !== DisconnectReason.loggedOut) {
            console.log(chalk.yellow(`🔄 Attempting to reconnect in 5 seconds...`));
            setTimeout(() => startConnection(), 5000);
        } else {
            console.log(chalk.red(`❌ Bot logged out. Please re-authenticate manually (rescan QR or regenerate pairing code)`));
            process.exit();
        }
    }
    
    if (connection === 'open') {
        const botInstance = getBotInstance();
        console.log(chalk.green(`✅ Connected to WhatsApp Web`));
        console.log(chalk.blue(`📱 Bot Number: ${botInstance.user.id.split(':')[0]}`));
        console.log(chalk.green(`🤖 Hisoka-md/his-v0 is ready for utility commands!`));
        onSuccess(); // Bloque les prompts après succès
    }
};

const handleGroupUpdate = async (update) => {
    const { id, participants, action } = update;
    try {
        const botInstance = getBotInstance();
        const groupMetadata = await botInstance.groupMetadata(id);
        console.log(chalk.blue(`👥 Group Update: ${action} in ${groupMetadata.subject}`));
        if (action === 'add') {
            for (const participant of participants) {
                console.log(chalk.green(`➕ User joined: ${participant}`));
            }
        } else if (action === 'remove') {
            for (const participant of participants) {
                console.log(chalk.yellow(`➖ User left: ${participant}`));
            }
        }
    } catch (error) {
        console.error(chalk.red(`❌ Group update error:`), error);
    }
};

module.exports = {
    startConnection
};