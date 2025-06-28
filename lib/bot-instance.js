/**
 * Bot Instance Manager for Hisoka-md/his-v0
 * Centralized bot instance to avoid circular dependencies
 */

let rav = null; // Main bot instance

const setBotInstance = (instance) => {
    rav = instance;
};

const getBotInstance = () => {
    return rav;
};

const isAdmin = async (jid, userId) => {
    try {
        if (!rav) return false;
        const metadata = await rav.groupMetadata(jid);
        if (!metadata) return false;
        
        const participant = metadata.participants.find(p => p.id === userId);
        return participant?.admin === 'admin' || participant?.admin === 'superadmin';
    } catch (error) {
        console.error('❌ Check admin error:', error);
        return false;
    }
};

const isBotAdmin = async (jid) => {
    try {
        if (!rav) return false;
        return await isAdmin(jid, rav.user.id);
    } catch (error) {
        console.error('❌ Check bot admin error:', error);
        return false;
    }
};

const sendMessage = async (jid, content, options = {}) => {
    try {
        if (!rav) throw new Error('Bot instance not available');
        return await rav.sendMessage(jid, content, options);
    } catch (error) {
        console.error('❌ Send message error:', error);
        throw error;
    }
};

const getGroupMetadata = async (jid) => {
    try {
        if (!rav) return null;
        return await rav.groupMetadata(jid);
    } catch (error) {
        console.error('❌ Get group metadata error:', error);
        return null;
    }
};

module.exports = {
    setBotInstance,
    getBotInstance,
    isAdmin,
    isBotAdmin,
    sendMessage,
    getGroupMetadata
};