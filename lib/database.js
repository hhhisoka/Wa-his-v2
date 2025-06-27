/**
 * Simple File-based Database for Hisoka-md/his-v0
 * Lightweight data storage for utility bot
 */

const { writeFileSync, readFileSync, existsSync, mkdirSync } = require('fs');
const { join } = require('path');
const chalk = require('chalk');

const DB_DIR = './database';
const DB_FILES = {
    users: join(DB_DIR, 'users.json'),
    groups: join(DB_DIR, 'groups.json'),
    settings: join(DB_DIR, 'settings.json')
};

// Ensure database directory exists
if (!existsSync(DB_DIR)) {
    mkdirSync(DB_DIR, { recursive: true });
}

class SimpleDB {
    constructor(filename) {
        this.filename = filename;
        this.data = this.load();
    }
    
    load() {
        try {
            if (existsSync(this.filename)) {
                return JSON.parse(readFileSync(this.filename, 'utf8'));
            }
        } catch (error) {
            console.error(chalk.red(`❌ Database load error (${this.filename}):`), error);
        }
        return {};
    }
    
    save() {
        try {
            writeFileSync(this.filename, JSON.stringify(this.data, null, 2));
        } catch (error) {
            console.error(chalk.red(`❌ Database save error (${this.filename}):`), error);
        }
    }
    
    get(key) {
        return this.data[key];
    }
    
    set(key, value) {
        this.data[key] = value;
        this.save();
    }
    
    has(key) {
        return key in this.data;
    }
    
    delete(key) {
        delete this.data[key];
        this.save();
    }
    
    all() {
        return this.data;
    }
    
    keys() {
        return Object.keys(this.data);
    }
    
    values() {
        return Object.values(this.data);
    }
    
    clear() {
        this.data = {};
        this.save();
    }
}

// Database instances
const usersDB = new SimpleDB(DB_FILES.users);
const groupsDB = new SimpleDB(DB_FILES.groups);
const settingsDB = new SimpleDB(DB_FILES.settings);

// User management functions
const addUser = (userId, data = {}) => {
    if (!usersDB.has(userId)) {
        usersDB.set(userId, {
            id: userId,
            registered: Date.now(),
            lastSeen: Date.now(),
            commandsUsed: 0,
            blocked: false,
            ...data
        });
        console.log(chalk.green(`👤 New user registered: ${userId}`));
    }
    return usersDB.get(userId);
};

const getUser = (userId) => {
    return usersDB.get(userId);
};

const updateUser = (userId, data) => {
    const user = usersDB.get(userId) || {};
    usersDB.set(userId, { ...user, ...data, lastSeen: Date.now() });
};

const isUserBlocked = (userId) => {
    const user = getUser(userId);
    return user?.blocked || false;
};

const blockUser = (userId) => {
    updateUser(userId, { blocked: true });
    console.log(chalk.yellow(`🚫 User blocked: ${userId}`));
};

const unblockUser = (userId) => {
    updateUser(userId, { blocked: false });
    console.log(chalk.green(`✅ User unblocked: ${userId}`));
};

// Group management functions
const addGroup = (groupId, data = {}) => {
    if (!groupsDB.has(groupId)) {
        groupsDB.set(groupId, {
            id: groupId,
            added: Date.now(),
            settings: {
                antilink: false,
                antispam: true,
                commands: true,
                welcome: false,
                goodbye: false
            },
            ...data
        });
        console.log(chalk.green(`👥 New group registered: ${groupId}`));
    }
    return groupsDB.get(groupId);
};

const getGroup = (groupId) => {
    return groupsDB.get(groupId);
};

const updateGroup = (groupId, data) => {
    const group = groupsDB.get(groupId) || {};
    groupsDB.set(groupId, { ...group, ...data });
};

const getGroupSetting = (groupId, setting) => {
    const group = getGroup(groupId);
    return group?.settings?.[setting] || false;
};

const setGroupSetting = (groupId, setting, value) => {
    const group = getGroup(groupId) || { settings: {} };
    group.settings[setting] = value;
    groupsDB.set(groupId, group);
    console.log(chalk.blue(`⚙️  Group setting updated: ${groupId} - ${setting}: ${value}`));
};

// Settings management
const getSetting = (key, defaultValue = null) => {
    return settingsDB.get(key) || defaultValue;
};

const setSetting = (key, value) => {
    settingsDB.set(key, value);
    console.log(chalk.blue(`⚙️  Setting updated: ${key}: ${value}`));
};

// Statistics
const getStats = () => {
    return {
        totalUsers: usersDB.keys().length,
        totalGroups: groupsDB.keys().length,
        blockedUsers: usersDB.values().filter(u => u.blocked).length,
        totalCommands: usersDB.values().reduce((total, user) => total + (user.commandsUsed || 0), 0)
    };
};

// Cleanup old data (utility function)
const cleanup = () => {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    // Remove users not seen in 30 days
    const users = usersDB.all();
    let cleanedUsers = 0;
    
    for (const [userId, userData] of Object.entries(users)) {
        if (userData.lastSeen < thirtyDaysAgo) {
            usersDB.delete(userId);
            cleanedUsers++;
        }
    }
    
    if (cleanedUsers > 0) {
        console.log(chalk.yellow(`🧹 Cleaned ${cleanedUsers} inactive users`));
    }
};

console.log(chalk.green('💾 Database system initialized'));

module.exports = {
    usersDB,
    groupsDB,
    settingsDB,
    addUser,
    getUser,
    updateUser,
    isUserBlocked,
    blockUser,
    unblockUser,
    addGroup,
    getGroup,
    updateGroup,
    getGroupSetting,
    setGroupSetting,
    getSetting,
    setSetting,
    getStats,
    cleanup
};
