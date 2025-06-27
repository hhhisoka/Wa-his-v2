/**
 * Utility Functions for Hisoka-md/his-v0
 * Professional helper functions for bot operations
 */

const { exec } = require('child_process');
const { createWriteStream, unlinkSync, existsSync } = require('fs');
const { join } = require('path');
const { promisify } = require('util');
const axios = require('axios');
const chalk = require('chalk');

const execAsync = promisify(exec);

class Func {
    // Time formatting
    static formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
        if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }
    
    // Size formatting
    static formatSize(bytes) {
        if (!bytes) return '0 Bytes';
        
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        
        return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
    }
    
    // Clean text (remove unwanted characters)
    static cleanText(text) {
        return text.replace(/[^\w\s\-_.]/gi, '').trim();
    }
    
    // Generate random string
    static randomString(length = 10) {
        return Math.random().toString(36).substring(2, length + 2);
    }
    
    // Check if URL is valid
    static isUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
    
    // Extract URLs from text
    static extractUrls(text) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.match(urlRegex) || [];
    }
    
    // Format phone number
    static formatPhone(number) {
        return number.replace(/[^\d]/g, '').replace(/^(\d{2})(\d{4})(\d{4})(\d{4})/, '$1 $2-$3-$4');
    }
    
    // System information
    static async getSystemInfo() {
        try {
            const { stdout: uptime } = await execAsync('uptime -p');
            const { stdout: memory } = await execAsync('free -h');
            const { stdout: disk } = await execAsync('df -h /');
            
            return {
                uptime: uptime.trim(),
                memory: memory.split('\n')[1].split(/\s+/)[2],
                disk: disk.split('\n')[1].split(/\s+/)[3]
            };
        } catch (error) {
            console.error(chalk.red('❌ System info error:'), error);
            return {
                uptime: 'Unknown',
                memory: 'Unknown',
                disk: 'Unknown'
            };
        }
    }
    
    // Download file
    static async downloadFile(url, filename) {
        try {
            const response = await axios({
                url,
                method: 'GET',
                responseType: 'stream'
            });
            
            const filepath = join('./temp', filename);
            const writer = createWriteStream(filepath);
            
            response.data.pipe(writer);
            
            return new Promise((resolve, reject) => {
                writer.on('finish', () => resolve(filepath));
                writer.on('error', reject);
            });
        } catch (error) {
            console.error(chalk.red('❌ Download error:'), error);
            throw error;
        }
    }
    
    // Delete file safely
    static deleteFile(filepath) {
        try {
            if (existsSync(filepath)) {
                unlinkSync(filepath);
                return true;
            }
        } catch (error) {
            console.error(chalk.red('❌ Delete file error:'), error);
        }
        return false;
    }
    
    // Execute command
    static async execCommand(command) {
        try {
            const { stdout, stderr } = await execAsync(command);
            return { success: true, output: stdout, error: stderr };
        } catch (error) {
            return { success: false, output: '', error: error.message };
        }
    }
    
    // Text processing
    static capitalizeFirst(text) {
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    }
    
    static titleCase(text) {
        return text.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
    }
    
    // Array utilities
    static chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
    
    static shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    // Validation
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    static isValidPhoneNumber(phone) {
        const phoneRegex = /^\+?[\d\s\-()]{10,}$/;
        return phoneRegex.test(phone);
    }
    
    // Parse duration (e.g., "1h 30m" -> milliseconds)
    static parseDuration(duration) {
        const units = {
            's': 1000,
            'm': 60000,
            'h': 3600000,
            'd': 86400000
        };
        
        let totalMs = 0;
        const matches = duration.match(/(\d+)([smhd])/g);
        
        if (matches) {
            for (const match of matches) {
                const [, num, unit] = match.match(/(\d+)([smhd])/);
                totalMs += parseInt(num) * (units[unit] || 0);
            }
        }
        
        return totalMs;
    }
    
    // Get file extension
    static getFileExtension(filename) {
        return filename.split('.').pop().toLowerCase();
    }
    
    // Check if file is image
    static isImage(filename) {
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
        return imageExtensions.includes(this.getFileExtension(filename));
    }
    
    // Check if file is video
    static isVideo(filename) {
        const videoExtensions = ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm'];
        return videoExtensions.includes(this.getFileExtension(filename));
    }
    
    // Check if file is audio
    static isAudio(filename) {
        const audioExtensions = ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'];
        return audioExtensions.includes(this.getFileExtension(filename));
    }
    
    // Escape markdown
    static escapeMarkdown(text) {
        return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
    }
    
    // Log with timestamp
    static log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const colors = {
            info: chalk.blue,
            success: chalk.green,
            warning: chalk.yellow,
            error: chalk.red
        };
        
        const color = colors[type] || chalk.white;
        console.log(color(`[${timestamp}] ${message}`));
    }
}

// Download manager for media processing
class DownloadManager {
    constructor() {
        this.tempDir = './temp';
        this.maxSize = 50 * 1024 * 1024; // 50MB
    }
    
    async downloadMedia(url, options = {}) {
        try {
            const filename = options.filename || `media_${Func.randomString(8)}`;
            const filepath = await Func.downloadFile(url, filename);
            
            return {
                success: true,
                filepath,
                filename,
                cleanup: () => Func.deleteFile(filepath)
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

const dl = new DownloadManager();

console.log(chalk.green('⚡ Utility functions loaded'));

module.exports = { Func, DownloadManager, dl };
