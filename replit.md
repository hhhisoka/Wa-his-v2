# Hisoka-md/his-v0 - Professional WhatsApp Utility Bot

## Overview

Hisoka-md/his-v0 is a professional WhatsApp utility bot built with Node.js and the Baileys library. The bot is designed to provide essential administrative and utility functions without entertainment features. It focuses on group management, media processing, and administrative tools for WhatsApp groups and users.

## System Architecture

### Frontend Architecture
- **WhatsApp Web Interface**: Uses Baileys library for WhatsApp Web connection
- **Connection Methods**: Supports both QR code and pairing code authentication
- **Multi-session Support**: File-based authentication state management

### Backend Architecture
- **Runtime**: Node.js v16+ with ES modules
- **Core Framework**: Baileys (@whiskeysockets/baileys) for WhatsApp integration
- **Architecture Pattern**: Plugin-based command system with modular structure
- **Event-driven Processing**: Message handling through event listeners

### Command System
- **Plugin Architecture**: Commands are organized in separate files under `/cmd` directory
- **Command Manager**: Centralized command registration and execution system
- **Permission System**: Role-based access control (owner, admin, user levels)
- **Category-based Organization**: Commands grouped by functionality (admin, group, media, utility, info)

## Key Components

### Core Libraries
- **Connection Handler** (`lib/connection.js`): Manages WhatsApp Web connection and authentication
- **Command Manager** (`lib/commands.js`): Handles command registration, validation, and execution
- **Message Processor** (`lib/message.js`): Processes incoming messages and routes commands
- **Database Layer** (`lib/database.js`): Simple file-based data storage system
- **Utility Functions** (`lib/functions.js`): Helper functions for common operations

### Command Categories
1. **Admin Commands** (`cmd/admin.js`): Bot administration, command enable/disable
2. **Group Management** (`cmd/group.js`): Group information, member management
3. **Media Processing** (`cmd/media.js`): Media file handling and conversion
4. **Owner Commands** (`cmd/owner.js`): Bot owner controls, user blocking/unblocking
5. **Utility Commands** (`cmd/utility.js`): URL shortening, QR code generation
6. **Information Commands** (`cmd/info.js`): Bot info, help system

### Security Features
- **Anti-spam Protection**: Rate limiting and cooldown systems
- **User Blocking**: Owner-controlled user restriction system
- **Permission Validation**: Command-level access control
- **Input Sanitization**: Text cleaning and validation

## Data Flow

1. **Message Reception**: WhatsApp messages received through Baileys connection
2. **Message Processing**: Messages parsed and validated in message handler
3. **Command Detection**: Text messages checked for command prefixes
4. **Permission Validation**: User permissions verified against command requirements
5. **Command Execution**: Validated commands executed with appropriate context
6. **Response Delivery**: Command results sent back through WhatsApp connection
7. **Data Persistence**: User activity and bot state saved to file-based database

## External Dependencies

### Core Dependencies
- **@whiskeysockets/baileys**: WhatsApp Web API implementation
- **@hapi/boom**: HTTP error handling utilities
- **axios**: HTTP client for external API calls
- **chalk**: Terminal color formatting for logging

### System Requirements
- **Node.js**: v16 or higher for ES modules support
- **FFmpeg**: Required for media processing and conversion
- **ImageMagick**: Needed for image manipulation features

### External APIs
- **TinyURL**: URL shortening service integration
- **QR Server**: QR code generation service

## Deployment Strategy

### Environment Setup
- **File-based Configuration**: Settings stored in `settings.js`
- **Environment Variables**: Bot number and sensitive data via env vars
- **Directory Structure**: Organized folder structure with temp, database, and command directories

### Session Management
- **Multi-file Auth State**: Authentication credentials stored in session files
- **Automatic Reconnection**: Built-in connection recovery mechanism
- **Session Persistence**: Auth state maintained across restarts

### Database Strategy
- **File-based Storage**: JSON files for lightweight data persistence
- **In-memory Caching**: Maps for runtime data storage
- **Automatic Backup**: Data saved on modifications

### Scaling Considerations
- **Single Instance Design**: Built for single bot deployment
- **Memory Management**: Efficient data structures for resource optimization
- **Modular Commands**: Easy to add/remove features without core changes

## Changelog

```
Changelog:
- June 27, 2025. Initial setup completed successfully
- June 27, 2025. Converted entire codebase from ES modules to CommonJS for compatibility
- June 27, 2025. Bot name confirmed as "Hisoka-md/his-v0" by @hhhisoka
- June 27, 2025. Variable "sius" replaced with "rav" as requested
- June 27, 2025. All entertainment features removed (no premium, VIP, level, games, fun commands)
- June 27, 2025. 58 utility commands loaded successfully across 6 categories
- June 27, 2025. System ready for WhatsApp Web connection
- June 27, 2025. Added sticker plugin with 3 commands (sticker, takestick, smeme)
- June 27, 2025. Made prefix configurable via environment variable (default: '.')
- June 27, 2025. Added Hisoka-themed images configuration
- June 27, 2025. Created 'start' workflow command for easy deployment
- June 27, 2025. Generated termux.sh installation script for Android
- June 27, 2025. Created DEPLOYMENT.md with deployment options guide
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```