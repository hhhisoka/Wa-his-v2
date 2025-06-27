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
const { bot } = require('../settings.js');
const { handleMessage } = require('./message.js');

let rav; // Main bot instance (replacing 'sius' with 'rav')
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
    const sessionPath = path.resolve(bot.session.folder);
    if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true });
    }
    
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version, isLatest } = await fetchLatestBaileysVersion();
    
    console.log(chalk.blue(`📱 Using WhatsApp Web v${version.join('.')}, isLatest: ${isLatest}`));
    
    const connectionOptions = {
        version,
        printQRInTerminal: process.argv.includes('--qr'),
        auth: state,
        browser: ['Hisoka-md/his-v0', 'Chrome', '1.0.0'],
        logger: pino({ level: 'silent' }),
        generateHighQualityLinkPreview: true,
        markOnlineOnConnect: false
    };
    
    rav = makeWASocket(connectionOptions);
    
    // Handle pairing code
    if (process.argv.includes('--pairing-code') && !rav.authState.creds.registered) {
        const phoneNumber = await question(chalk.cyan('📱 Enter your WhatsApp number (with country code): '));
        const code = await rav.requestPairingCode(phoneNumber.trim());
        console.log(chalk.green(`🔐 Pairing code: ${code}`));
    }
    
    // Connection event handlers
    rav.ev.on('connection.update', handleConnectionUpdate);
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
    }
    
    if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        
        console.log(chalk.red('❌ Connection closed'), lastDisconnect?.error, chalk.yellow('Reconnecting...', shouldReconnect));
        
        if (shouldReconnect) {
            setTimeout(() => startConnection(), 3000);
        }
    } else if (connection === 'open') {
        console.log(chalk.green('✅ Connected to WhatsApp Web'));
        console.log(chalk.blue(`📱 Bot Number: ${rav.user.id.split(':')[0]}`));
        console.log(chalk.green('🤖 Hisoka-md/his-v0 is ready for utility commands!'));
    }
};

const handleGroupUpdate = async (update) => {
    const { id, participants, action } = update;
    
    try {
        const groupMetadata = await rav.groupMetadata(id);
        
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

// Utility functions
const sendMessage = async (jid, content, options = {}) => {
    try {
        return await rav.sendMessage(jid, content, options);
    } catch (error) {
        console.error(chalk.red('❌ Send message error:'), error);
        throw error;
    }
};

const getGroupMetadata = async (jid) => {
    try {
        return await rav.groupMetadata(jid);
    } catch (error) {
        console.error(chalk.red('❌ Get group metadata error:'), error);
        return null;
    }
};

const isAdmin = async (jid, userId) => {
    try {
        const metadata = await getGroupMetadata(jid);
        if (!metadata) return false;
        
        const participant = metadata.participants.find(p => p.id === userId);
        return participant?.admin === 'admin' || participant?.admin === 'superadmin';
    } catch (error) {
        console.error(chalk.red('❌ Check admin error:'), error);
        return false;
    }
};

const isBotAdmin = async (jid) => {
    try {
        return await isAdmin(jid, rav.user.id);
    } catch (error) {
        console.error(chalk.red('❌ Check bot admin error:'), error);
        return false;
    }
};

module.exports = {
    startConnection,
    sendMessage,
    getGroupMetadata,
    isAdmin,
    isBotAdmin,
    rav
};