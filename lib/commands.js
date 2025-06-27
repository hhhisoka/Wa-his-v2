/**
 * Command Management System for Hisoka-md/his-v0
 * Professional command handling with plugin architecture
 */

const chalk = require('chalk');
const { bot } = require('../settings.js');

class CommandManager {
    constructor() {
        this.commands = new Map();
        this.cooldowns = new Map();
        this.stats = new Map();
    }
    
    // Add command to system
    add(commandData) {
        try {
            // Validate required fields
            if (!commandData.name || !Array.isArray(commandData.name)) {
                throw new Error('Command name is required and must be an array');
            }
            
            if (!commandData.command || !Array.isArray(commandData.command)) {
                throw new Error('Command triggers are required and must be an array');
            }
            
            if (!commandData.category) {
                throw new Error('Command category is required');
            }
            
            if (typeof commandData.run !== 'function') {
                throw new Error('Command run function is required');
            }
            
            // Set defaults
            const command = {
                name: commandData.name,
                command: commandData.command,
                alias: commandData.alias || [],
                category: commandData.category,
                desc: commandData.desc || 'No description provided',
                usage: commandData.usage || '',
                example: commandData.example || '',
                cooldown: commandData.cooldown || 3,
                limit: commandData.limit || 0,
                premium: commandData.premium || false,
                level: commandData.level || 0,
                owner: commandData.owner || false,
                group: commandData.group || false,
                admin: commandData.admin || false,
                botAdmin: commandData.botAdmin || false,
                private: commandData.private || false,
                register: commandData.register || false,
                enable: commandData.enable !== false,
                hidden: commandData.hidden || false,
                run: commandData.run,
                usageCount: 0,
                lastUsed: null,
                created: Date.now()
            };
            
            // Store command
            this.commands.set(commandData.name[0], command);
            
            // Initialize stats
            this.stats.set(commandData.name[0], {
                usage: 0,
                lastUsed: null,
                errors: 0
            });
            
            return true;
        } catch (error) {
            console.error(chalk.red(`❌ Failed to add command: ${error.message}`));
            return false;
        }
    }
    
    // Remove command
    remove(name) {
        if (this.commands.has(name)) {
            this.commands.delete(name);
            this.stats.delete(name);
            this.cooldowns.delete(name);
            return true;
        }
        return false;
    }
    
    // Find command by name or alias
    findCommand(query) {
        query = query.toLowerCase();
        
        for (const [name, cmd] of this.commands) {
            // Check main commands
            if (cmd.command.some(c => c.toLowerCase() === query)) {
                return cmd;
            }
            
            // Check aliases
            if (cmd.alias && cmd.alias.some(a => a.toLowerCase() === query)) {
                return cmd;
            }
        }
        
        return null;
    }
    
    // Get all commands with optional filters
    getAllCommands(filters = {}) {
        let commands = Array.from(this.commands.values());
        
        if (filters.category) {
            commands = commands.filter(cmd => cmd.category === filters.category);
        }
        
        if (filters.enabled !== undefined) {
            commands = commands.filter(cmd => cmd.enable === filters.enabled);
        }
        
        if (filters.hidden !== undefined) {
            commands = commands.filter(cmd => cmd.hidden === filters.hidden);
        }
        
        return commands;
    }
    
    // Get commands by category
    getByCategory(category) {
        return this.getAllCommands({ category });
    }
    
    // Get all unique categories
    getCategories() {
        const categories = new Set();
        for (const cmd of this.commands.values()) {
            categories.add(cmd.category);
        }
        return Array.from(categories);
    }
    
    // Enable/disable command
    setCommandState(name, enabled) {
        const command = this.commands.get(name);
        if (command) {
            command.enable = enabled;
            return true;
        }
        return false;
    }
    
    // Check cooldown
    checkCooldown(commandName, userId) {
        const key = `${commandName}_${userId}`;
        const cooldownData = this.cooldowns.get(key);
        
        if (!cooldownData) return false;
        
        const now = Date.now();
        const command = this.commands.get(commandName);
        const cooldownTime = (command?.cooldown || 3) * 1000;
        
        return (now - cooldownData.timestamp) < cooldownTime;
    }
    
    // Set cooldown
    setCooldown(commandName, userId) {
        const key = `${commandName}_${userId}`;
        this.cooldowns.set(key, {
            timestamp: Date.now(),
            userId,
            commandName
        });
    }
    
    // Get remaining cooldown time
    getRemainingCooldown(commandName, userId) {
        const key = `${commandName}_${userId}`;
        const cooldownData = this.cooldowns.get(key);
        
        if (!cooldownData) return 0;
        
        const now = Date.now();
        const command = this.commands.get(commandName);
        const cooldownTime = (command?.cooldown || 3) * 1000;
        const elapsed = now - cooldownData.timestamp;
        
        return Math.max(0, cooldownTime - elapsed);
    }
    
    // Increment usage stats
    incrementUsage(commandName) {
        const command = this.commands.get(commandName);
        const stats = this.stats.get(commandName);
        
        if (command && stats) {
            command.usageCount++;
            command.lastUsed = Date.now();
            stats.usage++;
            stats.lastUsed = Date.now();
        }
    }
    
    // Increment error stats
    incrementError(commandName) {
        const stats = this.stats.get(commandName);
        if (stats) {
            stats.errors++;
        }
    }
    
    // Get command statistics
    getStats(commandName = null) {
        if (commandName) {
            return this.stats.get(commandName);
        }
        
        // Return overall stats
        let totalUsage = 0;
        let totalErrors = 0;
        
        for (const stats of this.stats.values()) {
            totalUsage += stats.usage;
            totalErrors += stats.errors;
        }
        
        return {
            totalCommands: this.commands.size,
            totalUsage,
            totalErrors,
            successRate: totalUsage ? ((totalUsage - totalErrors) / totalUsage * 100).toFixed(2) : 0
        };
    }
    
    // Get top used commands
    getTopCommands(limit = 10) {
        return Array.from(this.commands.values())
            .sort((a, b) => b.usageCount - a.usageCount)
            .slice(0, limit)
            .map(cmd => ({
                name: cmd.name[0],
                usage: cmd.usageCount,
                lastUsed: cmd.lastUsed
            }));
    }
    
    // Clean up old cooldowns
    cleanupCooldowns() {
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        for (const [key, data] of this.cooldowns) {
            if (now - data.timestamp > maxAge) {
                this.cooldowns.delete(key);
            }
        }
    }
    
    // Reset all stats
    reset() {
        this.commands.clear();
        this.cooldowns.clear();
        this.stats.clear();
    }
    
    // Export commands data
    export() {
        return {
            commands: Array.from(this.commands.entries()),
            stats: Array.from(this.stats.entries()),
            timestamp: Date.now()
        };
    }
    
    // Get command help text
    getCommandHelp(commandName) {
        const command = this.findCommand(commandName);
        if (!command) return null;
        
        let help = `*${command.name[0].toUpperCase()}*\n`;
        help += `📝 ${command.desc}\n`;
        
        if (command.usage) {
            help += `📋 Usage: ${bot.prefix[0]}${command.command[0]} ${command.usage}\n`;
        }
        
        if (command.example) {
            help += `📖 Example: ${bot.prefix[0]}${command.command[0]} ${command.example}\n`;
        }
        
        if (command.alias.length > 0) {
            help += `🔗 Aliases: ${command.alias.join(', ')}\n`;
        }
        
        help += `📂 Category: ${command.category}\n`;
        help += `⏱️ Cooldown: ${command.cooldown}s\n`;
        
        // Restrictions
        const restrictions = [];
        if (command.owner) restrictions.push('Owner Only');
        if (command.admin) restrictions.push('Admin Only');
        if (command.group) restrictions.push('Group Only');
        if (command.private) restrictions.push('Private Only');
        if (command.premium) restrictions.push('Premium Only');
        if (command.botAdmin) restrictions.push('Bot Admin Required');
        
        if (restrictions.length > 0) {
            help += `🚫 Restrictions: ${restrictions.join(', ')}\n`;
        }
        
        return help;
    }
}

// Create global command manager instance
const commands = new CommandManager();

console.log(chalk.green('⚡ Command system initialized'));

module.exports = { commands };
