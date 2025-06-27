/**
 * Sticker Commands for Hisoka-md/his-v0
 * Professional sticker creation and management utilities
 */

const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Register sticker commands
const stickers = [
    {
        name: 'sticker',
        aliases: ['s', 'stiker'],
        category: 'media',
        description: 'Convertir une image ou vidéo en sticker',
        usage: 'Répondre à une image/vidéo avec .sticker',
        cooldown: 5,
        execute: async (sock, message, args) => {
            const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            
            if (!quoted) {
                return sock.sendMessage(message.key.remoteJid, {
                    text: '❌ Veuillez répondre à une image ou vidéo pour créer un sticker!'
                });
            }

            const mediaType = quoted.imageMessage ? 'image' : quoted.videoMessage ? 'video' : null;
            
            if (!mediaType) {
                return sock.sendMessage(message.key.remoteJid, {
                    text: '❌ Seules les images et vidéos peuvent être converties en stickers!'
                });
            }

            try {
                await sock.sendMessage(message.key.remoteJid, {
                    text: '🔄 Création du sticker en cours...'
                });

                const media = await downloadContentFromMessage(
                    quoted[mediaType === 'image' ? 'imageMessage' : 'videoMessage'],
                    mediaType
                );

                let buffer = Buffer.from([]);
                for await (const chunk of media) {
                    buffer = Buffer.concat([buffer, chunk]);
                }

                const tempDir = path.join(__dirname, '../temp');
                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir, { recursive: true });
                }

                const inputFile = path.join(tempDir, `input_${Date.now()}.${mediaType === 'image' ? 'jpg' : 'mp4'}`);
                const outputFile = path.join(tempDir, `output_${Date.now()}.webp`);

                fs.writeFileSync(inputFile, buffer);

                let ffmpegCmd;
                if (mediaType === 'image') {
                    ffmpegCmd = `ffmpeg -i "${inputFile}" -vf "scale=512:512:force_original_aspect_ratio=increase,crop=512:512" -quality 100 "${outputFile}"`;
                } else {
                    ffmpegCmd = `ffmpeg -i "${inputFile}" -t 10 -vf "scale=512:512:force_original_aspect_ratio=increase,crop=512:512,fps=15" -c:v libwebp -quality 100 "${outputFile}"`;
                }

                await execAsync(ffmpegCmd);

                const stickerBuffer = fs.readFileSync(outputFile);
                
                await sock.sendMessage(message.key.remoteJid, {
                    sticker: stickerBuffer
                });

                // Nettoyer les fichiers temporaires
                fs.unlinkSync(inputFile);
                fs.unlinkSync(outputFile);

            } catch (error) {
                console.error('Erreur création sticker:', error);
                await sock.sendMessage(message.key.remoteJid, {
                    text: '❌ Erreur lors de la création du sticker. Assurez-vous que FFmpeg est installé.'
                });
            }
        }
    },
    {
        name: 'takestick',
        aliases: ['take', 'wm'],
        category: 'media',
        description: 'Ajouter un watermark à un sticker',
        usage: '.takestick nom|auteur (répondre à un sticker)',
        cooldown: 5,
        execute: async (sock, message, args) => {
            const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            
            if (!quoted?.stickerMessage) {
                return sock.sendMessage(message.key.remoteJid, {
                    text: '❌ Veuillez répondre à un sticker pour ajouter un watermark!'
                });
            }

            const text = args.join(' ');
            if (!text) {
                return sock.sendMessage(message.key.remoteJid, {
                    text: '❌ Format: .takestick nom|auteur\nExemple: .takestick Hisoka|@hhhisoka'
                });
            }

            const [packname, author] = text.split('|').map(t => t.trim());

            try {
                await sock.sendMessage(message.key.remoteJid, {
                    text: '🔄 Ajout du watermark...'
                });

                const media = await downloadContentFromMessage(quoted.stickerMessage, 'sticker');
                let buffer = Buffer.from([]);
                for await (const chunk of media) {
                    buffer = Buffer.concat([buffer, chunk]);
                }

                await sock.sendMessage(message.key.remoteJid, {
                    sticker: buffer,
                    contextInfo: {
                        externalAdReply: {
                            title: packname || 'Hisoka-md',
                            body: author || '@hhhisoka',
                            mediaType: 1,
                            renderLargerThumbnail: false
                        }
                    }
                });

            } catch (error) {
                console.error('Erreur watermark sticker:', error);
                await sock.sendMessage(message.key.remoteJid, {
                    text: '❌ Erreur lors de l\'ajout du watermark.'
                });
            }
        }
    },
    {
        name: 'smeme',
        aliases: ['stickermeme', 'meme'],
        category: 'media',
        description: 'Créer un meme sticker avec texte',
        usage: '.smeme texte_haut|texte_bas (répondre à une image)',
        cooldown: 5,
        execute: async (sock, message, args) => {
            const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            
            if (!quoted?.imageMessage) {
                return sock.sendMessage(message.key.remoteJid, {
                    text: '❌ Veuillez répondre à une image pour créer un meme sticker!'
                });
            }

            const text = args.join(' ');
            if (!text) {
                return sock.sendMessage(message.key.remoteJid, {
                    text: '❌ Format: .smeme texte_haut|texte_bas\nExemple: .smeme Hisoka|Bot'
                });
            }

            const [topText, bottomText] = text.split('|').map(t => t.trim());

            try {
                await sock.sendMessage(message.key.remoteJid, {
                    text: '🔄 Création du meme sticker en cours...'
                });

                const media = await downloadContentFromMessage(quoted.imageMessage, 'image');
                let buffer = Buffer.from([]);
                for await (const chunk of media) {
                    buffer = Buffer.concat([buffer, chunk]);
                }

                const tempDir = path.join(__dirname, '../temp');
                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir, { recursive: true });
                }

                const inputFile = path.join(tempDir, `meme_input_${Date.now()}.jpg`);
                const outputFile = path.join(tempDir, `meme_output_${Date.now()}.webp`);

                fs.writeFileSync(inputFile, buffer);

                let ffmpegCmd = `ffmpeg -i "${inputFile}" -vf "scale=512:512:force_original_aspect_ratio=increase,crop=512:512`;
                
                if (topText) {
                    ffmpegCmd += `,drawtext=text='${topText}':fontcolor=white:fontsize=40:x=(w-text_w)/2:y=50:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf`;
                }
                
                if (bottomText) {
                    ffmpegCmd += `,drawtext=text='${bottomText}':fontcolor=white:fontsize=40:x=(w-text_w)/2:y=h-100:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf`;
                }
                
                ffmpegCmd += `" -quality 100 "${outputFile}"`;

                await execAsync(ffmpegCmd);

                const stickerBuffer = fs.readFileSync(outputFile);
                
                await sock.sendMessage(message.key.remoteJid, {
                    sticker: stickerBuffer
                });

                // Nettoyer les fichiers temporaires
                fs.unlinkSync(inputFile);
                fs.unlinkSync(outputFile);

            } catch (error) {
                console.error('Erreur création meme sticker:', error);
                await sock.sendMessage(message.key.remoteJid, {
                    text: '❌ Erreur lors de la création du meme sticker.'
                });
            }
        }
    }
];

module.exports = { stickers };