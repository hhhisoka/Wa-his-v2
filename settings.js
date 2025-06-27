/**
 * Hisoka-md/his-v0 Configuration
 * Professional WhatsApp Utility Bot Settings
 */

const bot = {
    // Bot Information
    name: 'Hisoka-md/his-v0',
    version: '1.0.0',
    creator: '@hhhisoka',
    description: 'Professional WhatsApp utility bot focused on essential features',
    
    // Connection Settings
    number: process.env.BOT_NUMBER || '628000000000', // REQUIRED: Change this to your bot number
    prefix: process.env.PREFIX || '.', // Configurable prefix (default: '.')
    mode: 'public', // 'public' or 'private'
    
    // Owner Settings
    owner: [
        '628000000000' // Add owner numbers here
    ],
    
    // Database Settings
    database: {
        users: new Map(),
        groups: new Map(),
        settings: new Map()
    },
    
    // Media Settings
    media: {
        maxSize: 50 * 1024 * 1024, // 50MB
        allowedTypes: ['image', 'video', 'audio', 'document'],
        tempDir: './temp'
    },
    
    // Security Settings
    security: {
        antiSpam: true,
        cooldown: 3000, // 3 seconds
        maxCommands: 20, // per minute
        blockedUsers: new Set()
    },
    
    // Feature Flags (Utility focused only)
    features: {
        // Admin & Management
        groupManagement: true,
        userManagement: true,
        
        // Utility Features
        mediaProcessing: true,
        fileConverter: true,
        systemInfo: true,
        
        // Disabled Entertainment Features
        games: false,
        fun: false,
        entertainment: false,
        economy: false,
        leveling: false
    },
    
    // API Settings
    apis: {
        // Add your API keys here if needed
        // Most utilities don't require external APIs
    },
    
    // Hisoka themed images
    images: {
        profile: 'https://telegra.ph/file/8cc9fc8c25b8d9cd60e5e.jpg', // Hisoka profile
        menu: 'https://telegra.ph/file/b0f56b3b4b7bb6dd5b6e8.jpg',    // Hisoka menu
        error: 'https://telegra.ph/file/c7b6b8f5d4c5e8f9a0b1c.jpg',   // Hisoka error
        success: 'https://telegra.ph/file/d8c9f0a1b2c3d4e5f6g7h.jpg', // Hisoka success
        welcome: 'https://telegra.ph/file/e9d0a1b2c3d4e5f6g7h8i.jpg', // Hisoka welcome
        sticker: 'https://telegra.ph/file/f0e1b2c3d4e5f6g7h8i9j.jpg'  // Hisoka sticker
    },
    
    // Sticker settings
    sticker: {
        packname: 'Hisoka-md/his-v0',
        author: '@hhhisoka',
        quality: 100
    },
    
    // Messages
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
    
    // Timezone
    timezone: 'Asia/Jakarta',
    
    // Session Settings
    session: {
        folder: './session',
        filename: 'hisoka-session'
    }
};

// Utility function to check if user is owner
const isOwner = (userId) => {
    return bot.owner.includes(userId.replace('@s.whatsapp.net', ''));
};

// Utility function to check if user is blocked
const isBlocked = (userId) => {
    return bot.security.blockedUsers.has(userId);
};

// Utility function to add user to database
const addUser = (userId, data = {}) => {
    if (!bot.database.users.has(userId)) {
        bot.database.users.set(userId, {
            id: userId,
            registered: Date.now(),
            lastSeen: Date.now(),
            commands: 0,
            blocked: false,
            ...data
        });
    }
};

// Utility function to add group to database
const addGroup = (groupId, data = {}) => {
    if (!bot.database.groups.has(groupId)) {
        bot.database.groups.set(groupId, {
            id: groupId,
            added: Date.now(),
            settings: {
                antilink: false,
                antispam: true,
                commands: true
            },
            ...data
        });
    }
};

module.exports = {
    bot,
    isOwner,
    isBlocked,
    addUser,
    addGroup
};

console.log('⚙️ Hisoka-md/his-v0 settings loaded');
