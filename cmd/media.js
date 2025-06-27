/**
 * Media Processing Commands for Hisoka-md/his-v0
 * Professional media handling and conversion utilities
 */

const { commands } = require('../lib/commands.js');
const { Func, dl } = require('../lib/functions.js');
const { exec } = require('child_process');
const { promisify } = require('util');
const { writeFileSync, readFileSync, existsSync, mkdirSync } = require('fs');
const { join } = require('path');
const axios = require('axios');

const execAsync = promisify(exec);

// Ensure temp directory exists
if (!existsSync('./temp')) {
    mkdirSync('./temp', { recursive: true });
}

// Media information
commands.add({
    name: ['mediainfo'],
    command: ['mediainfo'],
    category: 'media',
    desc: 'Get media file information',
    run: async ({ rav, m, reply }) => {
        try {
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quoted) {
                return await reply('❌ Please reply to a media file (image, video, audio).');
            }
            
            let mediaMessage;
            let mediaType;
            
            if (quoted.imageMessage) {
                mediaMessage = quoted.imageMessage;
                mediaType = 'image';
            } else if (quoted.videoMessage) {
                mediaMessage = quoted.videoMessage;
                mediaType = 'video';
            } else if (quoted.audioMessage) {
                mediaMessage = quoted.audioMessage;
                mediaType = 'audio';
            } else if (quoted.documentMessage) {
                mediaMessage = quoted.documentMessage;
                mediaType = 'document';
            } else {
                return await reply('❌ Please reply to a media file.');
            }
            
            const fileSize = mediaMessage.fileLength || 0;
            const mimetype = mediaMessage.mimetype || 'Unknown';
            const seconds = mediaMessage.seconds || 0;
            const width = mediaMessage.width || 0;
            const height = mediaMessage.height || 0;
            
            let info = `╭─「 *Media Information* 」\n`;
            info += `│ 📁 *Type:* ${Func.capitalizeFirst(mediaType)}\n`;
            info += `│ 📄 *MIME Type:* ${mimetype}\n`;
            info += `│ 📏 *File Size:* ${Func.formatSize(fileSize)}\n`;
            
            if (seconds > 0) {
                info += `│ ⏱️ *Duration:* ${Func.formatTime(seconds * 1000)}\n`;
            }
            
            if (width > 0 && height > 0) {
                info += `│ 📐 *Dimensions:* ${width}x${height}\n`;
            }
            
            if (mediaMessage.caption) {
                info += `│ 📝 *Caption:* ${mediaMessage.caption}\n`;
            }
            
            info += `╰────────────────────`;
            
            await reply(info);
        } catch (error) {
            await reply(`❌ Error getting media info: ${error.message}`);
        }
    }
});

// Convert image to sticker
commands.add({
    name: ['sticker'],
    command: ['sticker', 's'],
    alias: ['stiker'],
    category: 'media',
    desc: 'Convert image/video to sticker',
    run: async ({ rav, m, reply }) => {
        try {
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quoted) {
                return await reply('❌ Please reply to an image or video.');
            }
            
            let mediaMessage;
            let isVideo = false;
            
            if (quoted.imageMessage) {
                mediaMessage = quoted.imageMessage;
            } else if (quoted.videoMessage) {
                mediaMessage = quoted.videoMessage;
                isVideo = true;
            } else {
                return await reply('❌ Please reply to an image or video.');
            }
            
            const fileSize = mediaMessage.fileLength || 0;
            if (fileSize > 2 * 1024 * 1024) { // 2MB limit
                return await reply('❌ File size too large. Maximum 2MB.');
            }
            
            await reply('⏳ Converting to sticker...');
            
            // Download media
            const buffer = await rav.downloadMediaMessage(m.message.extendedTextMessage.contextInfo.quotedMessage, 'buffer');
            
            const inputFile = join('./temp', `input_${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`);
            const outputFile = join('./temp', `sticker_${Date.now()}.webp`);
            
            writeFileSync(inputFile, buffer);
            
            // Convert to sticker
            let command;
            if (isVideo) {
                // Convert video to animated sticker
                command = `ffmpeg -i "${inputFile}" -vf "scale=512:512:force_original_aspect_ratio=decrease,fps=15" -loop 0 -preset default -an -vsync 0 -s 512:512 "${outputFile}"`;
            } else {
                // Convert image to static sticker
                command = `ffmpeg -i "${inputFile}" -vf "scale=512:512:force_original_aspect_ratio=decrease" "${outputFile}"`;
            }
            
            await execAsync(command);
            
            if (existsSync(outputFile)) {
                const stickerBuffer = readFileSync(outputFile);
                
                await rav.sendMessage(m.key.remoteJid, {
                    sticker: stickerBuffer
                });
                
                // Cleanup
                Func.deleteFile(inputFile);
                Func.deleteFile(outputFile);
            } else {
                throw new Error('Failed to create sticker');
            }
            
        } catch (error) {
            await reply(`❌ Error creating sticker: ${error.message}`);
        }
    }
});

// Convert sticker to image
commands.add({
    name: ['toimage'],
    command: ['toimage', 'toimg'],
    category: 'media',
    desc: 'Convert sticker to image',
    run: async ({ rav, m, reply }) => {
        try {
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quoted?.stickerMessage) {
                return await reply('❌ Please reply to a sticker.');
            }
            
            await reply('⏳ Converting sticker to image...');
            
            // Download sticker
            const buffer = await rav.downloadMediaMessage(m.message.extendedTextMessage.contextInfo.quotedMessage, 'buffer');
            
            const inputFile = join('./temp', `sticker_${Date.now()}.webp`);
            const outputFile = join('./temp', `image_${Date.now()}.jpg`);
            
            writeFileSync(inputFile, buffer);
            
            // Convert webp to jpg
            const command = `ffmpeg -i "${inputFile}" "${outputFile}"`;
            await execAsync(command);
            
            if (existsSync(outputFile)) {
                const imageBuffer = readFileSync(outputFile);
                
                await rav.sendMessage(m.key.remoteJid, {
                    image: imageBuffer,
                    caption: '✅ Sticker converted to image'
                });
                
                // Cleanup
                Func.deleteFile(inputFile);
                Func.deleteFile(outputFile);
            } else {
                throw new Error('Failed to convert sticker');
            }
            
        } catch (error) {
            await reply(`❌ Error converting sticker: ${error.message}`);
        }
    }
});

// Extract audio from video
commands.add({
    name: ['toaudio'],
    command: ['toaudio', 'tomp3'],
    category: 'media',
    desc: 'Extract audio from video',
    run: async ({ rav, m, reply }) => {
        try {
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quoted?.videoMessage) {
                return await reply('❌ Please reply to a video.');
            }
            
            const fileSize = quoted.videoMessage.fileLength || 0;
            if (fileSize > 20 * 1024 * 1024) { // 20MB limit
                return await reply('❌ File size too large. Maximum 20MB.');
            }
            
            await reply('⏳ Extracting audio from video...');
            
            // Download video
            const buffer = await rav.downloadMediaMessage(m.message.extendedTextMessage.contextInfo.quotedMessage, 'buffer');
            
            const inputFile = join('./temp', `video_${Date.now()}.mp4`);
            const outputFile = join('./temp', `audio_${Date.now()}.mp3`);
            
            writeFileSync(inputFile, buffer);
            
            // Extract audio
            const command = `ffmpeg -i "${inputFile}" -vn -acodec libmp3lame -ab 128k -ar 44100 -y "${outputFile}"`;
            await execAsync(command);
            
            if (existsSync(outputFile)) {
                const audioBuffer = readFileSync(outputFile);
                
                await rav.sendMessage(m.key.remoteJid, {
                    audio: audioBuffer,
                    mimetype: 'audio/mp4',
                    ptt: false
                });
                
                // Cleanup
                Func.deleteFile(inputFile);
                Func.deleteFile(outputFile);
            } else {
                throw new Error('Failed to extract audio');
            }
            
        } catch (error) {
            await reply(`❌ Error extracting audio: ${error.message}`);
        }
    }
});

// Create voice note from audio
commands.add({
    name: ['tovn'],
    command: ['tovn', 'toptt'],
    category: 'media',
    desc: 'Convert audio to voice note',
    run: async ({ rav, m, reply }) => {
        try {
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quoted?.audioMessage && !quoted?.videoMessage) {
                return await reply('❌ Please reply to an audio or video file.');
            }
            
            await reply('⏳ Converting to voice note...');
            
            // Download media
            const buffer = await rav.downloadMediaMessage(m.message.extendedTextMessage.contextInfo.quotedMessage, 'buffer');
            
            const inputFile = join('./temp', `input_${Date.now()}.${quoted.videoMessage ? 'mp4' : 'mp3'}`);
            const outputFile = join('./temp', `voice_${Date.now()}.ogg`);
            
            writeFileSync(inputFile, buffer);
            
            // Convert to voice note format
            const command = `ffmpeg -i "${inputFile}" -c:a libopus -b:a 128k -vn "${outputFile}"`;
            await execAsync(command);
            
            if (existsSync(outputFile)) {
                const voiceBuffer = readFileSync(outputFile);
                
                await rav.sendMessage(m.key.remoteJid, {
                    audio: voiceBuffer,
                    mimetype: 'audio/ogg; codecs=opus',
                    ptt: true
                });
                
                // Cleanup
                Func.deleteFile(inputFile);
                Func.deleteFile(outputFile);
            } else {
                throw new Error('Failed to create voice note');
            }
            
        } catch (error) {
            await reply(`❌ Error creating voice note: ${error.message}`);
        }
    }
});

// Image enhancement
commands.add({
    name: ['enhance'],
    command: ['enhance', 'hd'],
    category: 'media',
    desc: 'Enhance image quality',
    run: async ({ rav, m, reply }) => {
        try {
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quoted?.imageMessage) {
                return await reply('❌ Please reply to an image.');
            }
            
            await reply('⏳ Enhancing image quality...');
            
            // Download image
            const buffer = await rav.downloadMediaMessage(m.message.extendedTextMessage.contextInfo.quotedMessage, 'buffer');
            
            const inputFile = join('./temp', `input_${Date.now()}.jpg`);
            const outputFile = join('./temp', `enhanced_${Date.now()}.jpg`);
            
            writeFileSync(inputFile, buffer);
            
            // Enhance using ImageMagick
            const command = `convert "${inputFile}" -enhance -sharpen 0x1 -quality 95 "${outputFile}"`;
            await execAsync(command);
            
            if (existsSync(outputFile)) {
                const enhancedBuffer = readFileSync(outputFile);
                
                await rav.sendMessage(m.key.remoteJid, {
                    image: enhancedBuffer,
                    caption: '✅ Image enhanced'
                });
                
                // Cleanup
                Func.deleteFile(inputFile);
                Func.deleteFile(outputFile);
            } else {
                throw new Error('Failed to enhance image');
            }
            
        } catch (error) {
            await reply(`❌ Error enhancing image: ${error.message}`);
        }
    }
});

// Compress image
commands.add({
    name: ['compress'],
    command: ['compress'],
    category: 'media',
    desc: 'Compress image file size',
    usage: '[quality]',
    example: '80',
    run: async ({ args, rav, m, reply }) => {
        try {
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quoted?.imageMessage) {
                return await reply('❌ Please reply to an image.');
            }
            
            const quality = parseInt(args[0]) || 75;
            if (quality < 10 || quality > 100) {
                return await reply('❌ Quality must be between 10 and 100.');
            }
            
            await reply(`⏳ Compressing image (${quality}% quality)...`);
            
            // Download image
            const buffer = await rav.downloadMediaMessage(m.message.extendedTextMessage.contextInfo.quotedMessage, 'buffer');
            
            const inputFile = join('./temp', `input_${Date.now()}.jpg`);
            const outputFile = join('./temp', `compressed_${Date.now()}.jpg`);
            
            writeFileSync(inputFile, buffer);
            
            // Compress image
            const command = `convert "${inputFile}" -quality ${quality} "${outputFile}"`;
            await execAsync(command);
            
            if (existsSync(outputFile)) {
                const compressedBuffer = readFileSync(outputFile);
                const originalSize = buffer.length;
                const compressedSize = compressedBuffer.length;
                const savedPercent = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
                
                await rav.sendMessage(m.key.remoteJid, {
                    image: compressedBuffer,
                    caption: `✅ Image compressed\n📏 Original: ${Func.formatSize(originalSize)}\n📦 Compressed: ${Func.formatSize(compressedSize)}\n💾 Saved: ${savedPercent}%`
                });
                
                // Cleanup
                Func.deleteFile(inputFile);
                Func.deleteFile(outputFile);
            } else {
                throw new Error('Failed to compress image');
            }
            
        } catch (error) {
            await reply(`❌ Error compressing image: ${error.message}`);
        }
    }
});

console.log('✅ Media commands loaded');
