#!/bin/bash

# Hisoka-md/his-v0 - Termux Installation Script
# Professional WhatsApp Utility Bot by @hhhisoka

echo "╔═══════════════════════════════════╗"
echo "║     Hisoka-md/his-v0 Installer   ║"
echo "║    Professional Utility Bot      ║"
echo "║        Created by @hhhisoka       ║"
echo "╚═══════════════════════════════════╝"
echo ""

# Check if running on Termux
if [ -z "$TERMUX_VERSION" ]; then
    echo "❌ This script is designed for Termux only!"
    echo "Please run this script in Termux app on Android."
    exit 1
fi

echo "🔄 Starting installation process..."
echo ""

# Update package list
echo "📦 Updating package list..."
pkg update && pkg upgrade -y

# Install required packages
echo "📦 Installing required packages..."
pkg install -y nodejs npm git ffmpeg imagemagick

# Create bot directory
echo "📁 Creating bot directory..."
cd $HOME
if [ -d "hisoka-bot" ]; then
    echo "⚠️ Directory 'hisoka-bot' already exists. Removing..."
    rm -rf Wa-his-v2
fi

# Clone or create bot files
echo "📥 Setting up bot files..."
git clone https://github.com/hhhisoka/Wa-his-v2
cd Wa-his-v2

# Create package.json
cat > package.json << 'EOF'
{
  "name": "hisoka-md-his-v0",
  "version": "1.0.0",
  "description": "Professional WhatsApp Utility Bot by @hhhisoka",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "node index.js --qr"
  },
  "keywords": ["whatsapp", "bot", "utility", "hisoka"],
  "author": "@hhhisoka",
  "license": "MIT",
  "dependencies": {
    "@whiskeysockets/baileys": "^6.7.8",
    "@hapi/boom": "^10.0.1",
    "axios": "^1.6.0",
    "chalk": "^4.1.2",
    "pino": "^8.0.0",
    "readline": "^1.3.0"
  }
}
EOF

# Install npm dependencies
echo "📦 Installing bot dependencies..."
npm install --force

echo ""
echo "✅ Installation completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. cd Wa-his-v2"
echo "2. Configure your settings in settings.js"
echo "3. Set your owner number and prefix"
echo "4. Run: npm start"
echo "5. Scan QR code with WhatsApp"
echo ""
echo "🎯 Bot Features:"
echo "• Admin & Group Management"
echo "• Media Processing & Stickers"
echo "• Utility Commands"
echo "• No Entertainment Features"
echo ""
echo "📞 Support: Contact @hhhisoka"
echo "🌟 Enjoy using Hisoka-md/his-v0!"