/**
 * WhatsApp Connection Handler for Hisoka-md/his-v0
 * Professional connection management with Baileys
 */

const fs = require('fs');
const path = require('path');
const { makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const chalk = require('chalk');
const readline = require('readline');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const { bot } = require('../settings.js');
const { setBotInstance, getBotInstance } = require('./bot-instance.js');

let shouldReconnect = true;

// Create readline interface for pairing code
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Question helper
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

const startConnection = async () => {
    // 🔒 Vérifie et crée le dossier de session si manquant
    const sessionPath = path.resolve("session");
    if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true });
    }
    
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version, isLatest } = await fetchLatestBaileysVersion();
    
    console.log(chalk.blue(`📱 Using WhatsApp Web v${version.join('.')}, isLatest: ${isLatest}`));
    
    const connectionOptions = {
        version,
        printQRInTerminal: false, // Will be controlled by user choice
        auth: state,
        browser: ['Hisoka-md/his-v0', 'Chrome', '1.0.0'],
        logger: pino({ level: 'silent' }),
        generateHighQualityLinkPreview: true,
        markOnlineOnConnect: false,
        connectTimeoutMs: 60000, // 1 minute connection timeout
        defaultQueryTimeoutMs: 60000, // 1 minute query timeout
        keepAliveIntervalMs: 30000, // Keep alive every 30 seconds
        retryRequestDelayMs: 2000 // 2 seconds retry delay
    };
    
    const rav = makeWASocket(connectionOptions);
    setBotInstance(rav);
    
    // Handle pairing code after connection is ready
    let pairingCodeRequested = false;
    
    rav.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (connection === 'connecting' && !rav.authState.creds.registered && !pairingCodeRequested) {
            pairingCodeRequested = true;
            
            console.log(chalk.cyan('🔗 Choose connection method:'));
            console.log(chalk.yellow('1. QR Code (scan with camera)'));
            console.log(chalk.yellow('2. Pairing Code (enter 8-digit code)'));
            
            const choice = await question(chalk.cyan('📱 Enter your choice (1 or 2): '));
            
            if (choice.trim() === '1') {
                // Enable QR code method
                console.log(chalk.cyan('📱 QR Code method selected'));
                console.log(chalk.yellow('📱 Scan the QR code below with your WhatsApp app'));
                
                // Re-create socket with QR enabled
                const qrOptions = { ...connectionOptions, printQRInTerminal: true };
                const newRav = makeWASocket(qrOptions);
                setBotInstance(newRav);
                
                // Setup events for new socket
                newRav.ev.on('connection.update', handleConnectionUpdate);
                newRav.ev.on('creds.update', saveCreds);
                const { handleMessage } = require('./message.js');
                newRav.ev.on('messages.upsert', handleMessage);
                newRav.ev.on('group-participants.update', handleGroupUpdate);
                
            } else if (choice.trim() === '2') {
                // Use pairing code method
                console.log(chalk.cyan('🔗 Pairing code method selected'));
                
                try {
                    const phoneNumber = await question(chalk.cyan('📱 Enter your WhatsApp number (with country code, example: +33123456789): '));
                    
                    // Wait a bit for connection to stabilize
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    const code = await rav.requestPairingCode(phoneNumber.trim());
                    console.log(chalk.green(`🔐 Pairing code: ${code}`));
                    console.log(chalk.yellow('📱 Go to WhatsApp > Settings > Linked Devices > Link a Device'));
                    console.log(chalk.yellow('📱 Choose "Link with phone number" and enter this code: ' + code));
                } catch (error) {
                    console.log(chalk.red('❌ Error generating pairing code:', error.message));
                    console.log(chalk.yellow('🔄 Restarting connection...'));
                    pairingCodeRequested = false;
                    setTimeout(() => startConnection(), 3000);
                }
            } else {
                console.log(chalk.red('❌ Invalid choice. Defaulting to QR code method...'));
                pairingCodeRequested = false;
                setTimeout(() => startConnection(), 2000);
            }
        }
        
        handleConnectionUpdate(update);
    });
    
    // Import handleMessage after bot instance is created to avoid circular dependency
    const { handleMessage } = require('./message.js');
    
    // Other event handlers
    rav.ev.on('creds.update', saveCreds);
    rav.ev.on('messages.upsert', handleMessage);
    
    // Group events
    rav.ev.on('group-participants.update', handleGroupUpdate);
    
    return rav;
};

const handleConnectionUpdate = (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
        console.log(chalk.yellow('📱 QR Code generated, scan with WhatsApp'));
        console.log(chalk.cyan('📱 QR Code:'));
        qrcode.generate(qr, { small: true });
        console.log(chalk.yellow('📱 Scan this QR code with your WhatsApp app'));
    }
    
    if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        
        console.log(chalk.red('❌ Connection closed'), lastDisconnect?.error, chalk.yellow('Reconnecting...', shouldReconnect));
        
        if (shouldReconnect) {
            console.log(chalk.yellow('🔄 Reconnecting in 5 seconds...'));
            setTimeout(() => startConnection(), 5000);
        }
    } else if (connection === 'open') {
        const botInstance = getBotInstance();
        console.log(chalk.green('✅ Connected to WhatsApp Web'));
        console.log(chalk.blue(`📱 Bot Number: ${botInstance.user.id.split(':')[0]}`));
        console.log(chalk.green('🤖 Hisoka-md/his-v0 is ready for utility commands!'));
    }
};

const handleGroupUpdate = async (update) => {
    const { id, participants, action } = update;
    
    try {
        const botInstance = getBotInstance();
        const groupMetadata = await botInstance.groupMetadata(id);
        
        // Log group events
        console.log(chalk.blue(`👥 Group Update: ${action} in ${groupMetadata.subject}`));
        
        // Handle welcome/goodbye (utility focused, no fancy messages)
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
        console.error(chalk.red('❌ Group update error:'), error);
    }
};

module.exports = {
    startConnection
};