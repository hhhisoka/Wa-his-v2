/**
 * Hisoka-md/his-v0 - Professional WhatsApp Utility Bot
 * Created by @hhhisoka
 * Focus: Essential utility features only
 */

const { join } = require('path');
const { readdirSync } = require('fs');
const chalk = require('chalk');
require('./lib/database.js');
const { startConnection } = require('./lib/connection.js');
const { commands } = require('./lib/commands.js');
const { bot } = require('./settings.js');

// Initialize bot
console.log(chalk.cyan('╔═══════════════════════════════════╗'));
console.log(chalk.cyan('║     Hisoka-md/his-v0 Starting    ║'));
console.log(chalk.cyan('║    Professional Utility Bot      ║'));
console.log(chalk.cyan('║        Created by @hhhisoka       ║'));
console.log(chalk.cyan('╚═══════════════════════════════════╝'));

// Load commands
const loadCommands = async () => {
    const cmdDir = join(__dirname, 'cmd');
    const cmdFiles = readdirSync(cmdDir).filter(file => file.endsWith('.js'));
    
    console.log(chalk.yellow('📦 Loading utility commands...'));
    
    for (const file of cmdFiles) {
        try {
            require(`./cmd/${file}`);
            console.log(chalk.green(`✓ Loaded: ${file}`));
        } catch (error) {
            console.log(chalk.red(`✗ Failed to load: ${file}`));
            console.error(error);
        }
    }
    
    console.log(chalk.blue(`📋 Total commands loaded: ${commands.getAllCommands().length}`));
};

// Main startup
const start = async () => {
    try {
        await loadCommands();
        await startConnection();
    } catch (error) {
        console.error(chalk.red('❌ Bot startup failed:'), error);
        process.exit(1);
    }
};

// Handle process termination
process.on('SIGINT', () => {
    console.log(chalk.yellow('\n⚠️  Bot shutting down...'));
    process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error(chalk.red('Unhandled Rejection at:'), promise, chalk.red('reason:'), reason);
});

// Start the bot
start();