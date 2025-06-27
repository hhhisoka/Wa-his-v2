#!/bin/bash

# Hisoka-md/his-v0 - Termux Installation Script
# Professional WhatsApp Utility Bot by @hhhisoka

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Fonction pour afficher le header principal
show_main_header() {
    clear
    echo -e "${PURPLE}╔═══════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║     Hisoka-md/his-v0 Installer   ║${NC}"
    echo -e "${PURPLE}║    Professional Utility Bot      ║${NC}"
    echo -e "${PURPLE}║        Created by @hhhisoka       ║${NC}"
    echo -e "${PURPLE}╚═══════════════════════════════════╝${NC}"
    echo ""
}

# Fonction pour afficher le header de configuration
show_config_header() {
    clear
    echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║                    HISOKA-MD CONFIGURATION                   ║${NC}"
    echo -e "${PURPLE}║                         Setup Tool                          ║${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Vérification Termux
check_termux() {
    if [ -z "$TERMUX_VERSION" ]; then
        echo -e "${RED}❌ This script is designed for Termux only!${NC}"
        echo -e "${YELLOW}Please run this script in Termux app on Android.${NC}"
        exit 1
    fi
}

# Installation des dépendances système
install_system_packages() {
    echo -e "${BLUE}🔄 Starting installation process...${NC}"
    echo ""
    
    echo -e "${CYAN}📦 Updating package list...${NC}"
    pkg update && pkg upgrade -y
    
    echo -e "${CYAN}📦 Installing required packages...${NC}"
    pkg install -y nodejs npm git ffmpeg imagemagick
}

# Clonage du repository
clone_repository() {
    echo -e "${CYAN}📁 Creating bot directory...${NC}"
    cd $HOME
    
    if [ -d "Wa-his-v2" ]; then
        echo -e "${YELLOW}⚠️ Directory 'Wa-his-v2' already exists. Removing...${NC}"
        rm -rf Wa-his-v2
    fi
    
    echo -e "${CYAN}📥 Setting up bot files...${NC}"
    git clone https://github.com/hhhisoka/Wa-his-v2
    cd Wa-his-v2
}

# Création du package.json
create_package_json() {
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
}

# Installation des dépendances npm
install_npm_dependencies() {
    echo -e "${CYAN}📦 Installing bot dependencies...${NC}"
    npm install --force
}

# Fonction pour lire l'input avec une valeur par défaut
read_with_default() {
    local prompt="$1"
    local default="$2"
    local result
    
    echo -ne "${CYAN}$prompt${NC}"
    if [ -n "$default" ]; then
        echo -ne " ${YELLOW}[défaut: $default]${NC}"
    fi
    echo -ne ": "
    read result
    
    if [ -z "$result" ] && [ -n "$default" ]; then
        result="$default"
    fi
    
    echo "$result"
}

# Fonction pour confirmer une action
confirm() {
    local prompt="$1"
    local response
    
    while true; do
        echo -ne "${YELLOW}$prompt (o/n): ${NC}"
        read response
        case $response in
            [Oo]* ) return 0;;
            [Nn]* ) return 1;;
            * ) echo -e "${RED}Veuillez répondre par 'o' pour oui ou 'n' pour non.${NC}";;
        esac
    done
}

# Fonction pour valider un numéro de téléphone
validate_phone() {
    local phone="$1"
    if [[ $phone =~ ^[0-9]{10,15}$ ]]; then
        return 0
    else
        return 1
    fi
}

# Fonction pour valider un préfixe
validate_prefix() {
    local prefix="$1"
    if [[ ${#prefix} -eq 1 ]]; then
        return 0
    else
        return 1
    fi
}

# Configuration interactive
interactive_setup() {
    show_config_header
    
    echo -e "${GREEN}🚀 Configuration interactive de Hisoka-MD${NC}"
    echo -e "${BLUE}Répondez aux questions suivantes pour configurer votre bot:${NC}"
    echo ""
    
    # Configuration du propriétaire
    echo -e "${PURPLE}📱 CONFIGURATION DU PROPRIÉTAIRE${NC}"
    echo "─────────────────────────────────────"
    
    while true; do
        OWNER_NUMBER=$(read_with_default "Numéro du propriétaire (format: 237xxxxxxxxx)" "237123456789")
        if validate_phone "$OWNER_NUMBER"; then
            break
        else
            echo -e "${RED}❌ Format invalide. Utilisez un numéro de 10-15 chiffres.${NC}"
        fi
    done
    
    OWNER_NAME=$(read_with_default "Nom du propriétaire" "Hisoka")
    
    # Configuration du préfixe unique
    echo ""
    echo -e "${PURPLE}⚙️ CONFIGURATION DU PRÉFIXE${NC}"
    echo "─────────────────────────────────────"
    
    while true; do
        PREFIX=$(read_with_default "Préfixe unique des commandes (un seul caractère)" ".")
        if validate_prefix "$PREFIX"; then
            break
        else
            echo -e "${RED}❌ Le préfixe doit être un seul caractère (ex: . ! # / @)${NC}"
        fi
    done
    
    # Configuration du bot
    echo ""
    echo -e "${PURPLE}🤖 CONFIGURATION DU BOT${NC}"
    echo "─────────────────────────────────────"
    
    BOT_NAME=$(read_with_default "Nom du bot" "Hisoka-MD")
    SESSION_NAME=$(read_with_default "Nom de la session" "hisoka-session")
    
    # Options avancées
    echo ""
    echo -e "${PURPLE}🔧 OPTIONS AVANCÉES${NC}"
    echo "─────────────────────────────────────"
    
    if confirm "Activer le mode développeur"; then
        DEVELOPER_MODE="true"
    else
        DEVELOPER_MODE="false"
    fi
    
    if confirm "Activer les logs détaillés"; then
        VERBOSE_LOGS="true"
    else
        VERBOSE_LOGS="false"
    fi
    
    if confirm "Activer la fonction anti-spam"; then
        ANTI_SPAM="true"
    else
        ANTI_SPAM="false"
    fi
    
    AUTO_READ=$(read_with_default "Lecture automatique des messages (true/false)" "false")
    AUTO_TYPING=$(read_with_default "Saisie automatique (true/false)" "false")
    
    # Résumé de la configuration
    show_config_summary
    
    if confirm "Confirmer cette configuration"; then
        create_config_file
        echo -e "${GREEN}✅ Configuration sauvegardée avec succès!${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️ Configuration annulée.${NC}"
        return 1
    fi
}

# Afficher le résumé de la configuration
show_config_summary() {
    echo ""
    echo -e "${PURPLE}📋 RÉSUMÉ DE LA CONFIGURATION${NC}"
    echo "════════════════════════════════════════════════════════════"
    echo -e "${CYAN}Propriétaire:${NC} $OWNER_NAME ($OWNER_NUMBER)"
    echo -e "${CYAN}Nom du bot:${NC} $BOT_NAME"
    echo -e "${CYAN}Préfixe unique:${NC} $PREFIX"
    echo -e "${CYAN}Session:${NC} $SESSION_NAME"
    echo -e "${CYAN}Mode développeur:${NC} $DEVELOPER_MODE"
    echo -e "${CYAN}Logs détaillés:${NC} $VERBOSE_LOGS"
    echo -e "${CYAN}Anti-spam:${NC} $ANTI_SPAM"
    echo -e "${CYAN}Lecture auto:${NC} $AUTO_READ"
    echo -e "${CYAN}Saisie auto:${NC} $AUTO_TYPING"
    echo "════════════════════════════════════════════════════════════"
    echo ""
}

# Créer le fichier de configuration
create_config_file() {
    cat > settings.js << EOF
// Configuration Hisoka-MD
// Généré automatiquement le $(date)

module.exports = {
    // Informations du propriétaire
    owner: {
        number: "$OWNER_NUMBER",
        name: "$OWNER_NAME"
    },
    
    // Configuration du bot
    bot: {
        name: "$BOT_NAME",
        prefix: "$PREFIX",
        sessionName: "$SESSION_NAME"
    },
    
    // Options
    options: {
        developerMode: $DEVELOPER_MODE,
        verboseLogs: $VERBOSE_LOGS,
        antiSpam: $ANTI_SPAM,
        autoRead: $AUTO_READ,
        autoTyping: $AUTO_TYPING
    },
    
    // Messages système
    messages: {
        waiting: "⏳ Traitement en cours...",
        error: "❌ Une erreur s'est produite",
        success: "✅ Commande exécutée avec succès",
        notOwner: "🚫 Seul le propriétaire peut utiliser cette commande",
        groupOnly: "👥 Cette commande ne fonctionne que dans les groupes"
    }
};
EOF
}

# Configuration rapide avec valeurs par défaut
quick_setup() {
    echo -e "${GREEN}⚡ Configuration rapide avec valeurs par défaut${NC}"
    echo ""
    
    OWNER_NUMBER="237123456789"
    OWNER_NAME="Hisoka"
    PREFIX="."
    BOT_NAME="Hisoka-MD"
    SESSION_NAME="hisoka-session"
    DEVELOPER_MODE="false"
    VERBOSE_LOGS="false"
    ANTI_SPAM="false"
    AUTO_READ="false"
    AUTO_TYPING="false"
    
    echo -e "${YELLOW}⚠️ Configuration par défaut utilisée:${NC}"
    echo -e "${CYAN}• Propriétaire:${NC} $OWNER_NAME ($OWNER_NUMBER)"
    echo -e "${CYAN}• Préfixe unique:${NC} $PREFIX"
    echo -e "${CYAN}• Nom du bot:${NC} $BOT_NAME"
    echo ""
    echo -e "${YELLOW}Vous pourrez modifier ces paramètres plus tard dans settings.js${NC}"
    
    create_config_file
    echo -e "${GREEN}✅ Configuration rapide terminée!${NC}"
}

# Menu de configuration
config_menu() {
    show_config_header
    echo -e "${GREEN}🎯 Comment souhaitez-vous configurer le bot ?${NC}"
    echo ""
    echo -e "${CYAN}1.${NC} Configuration interactive complète"
    echo -e "${CYAN}2.${NC} Configuration rapide (valeurs par défaut)"
    echo -e "${CYAN}3.${NC} Ignorer la configuration (configurer manuellement plus tard)"
    echo ""
    echo -ne "${YELLOW}Votre choix (1-3): ${NC}"
    read config_choice
    
    case $config_choice in
        1) 
            if interactive_setup; then
                return 0
            else
                return 1
            fi
            ;;
        2) 
            quick_setup
            return 0
            ;;
        3) 
            echo -e "${YELLOW}⚠️ Configuration ignorée. Vous devrez configurer manuellement settings.js${NC}"
            return 0
            ;;
        *) 
            echo -e "${RED}❌ Choix invalide.${NC}"
            sleep 2
            config_menu
            ;;
    esac
}

# Affichage des instructions finales
show_final_instructions() {
    echo ""
    echo -e "${GREEN}✅ Installation completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}📋 Next steps:${NC}"
    echo -e "${CYAN}1. cd Wa-his-v2${NC}"
    if [ ! -f "settings.js" ]; then
        echo -e "${CYAN}2. Configure your settings in settings.js${NC}"
        echo -e "${CYAN}3. Set your owner number and prefix${NC}"
        echo -e "${CYAN}4. Run: npm start${NC}"
    else
        echo -e "${CYAN}2. Run: npm start${NC}"
    fi
    echo -e "${CYAN}5. Scan QR code with WhatsApp${NC}"
    echo ""
    echo -e "${BLUE}🎯 Bot Features:${NC}"
    echo -e "${GREEN}• Admin & Group Management${NC}"
    echo -e "${GREEN}• Media Processing & Stickers${NC}"
    echo -e "${GREEN}• Utility Commands${NC}"
    echo -e "${GREEN}• No Entertainment Features${NC}"
    echo ""
    echo -e "${BLUE}📞 Support:${NC} Contact @hhhisoka"
    echo -e "${BLUE}🌟 Enjoy using Hisoka-md/his-v0!${NC}"
    echo ""
    
    if confirm "Démarrer le bot maintenant"; then
        echo -e "${GREEN}🚀 Démarrage du bot...${NC}"
        echo -e "${YELLOW}Scannez le QR code avec WhatsApp${NC}"
        npm start
    fi
}

# Menu de gestion post-installation
management_menu() {
    while true; do
        show_config_header
        echo -e "${GREEN}🎯 Que souhaitez-vous faire ?${NC}"
        echo ""
        echo -e "${CYAN}1.${NC} Reconfigurer le bot"
        echo -e "${CYAN}2.${NC} Modifier le propriétaire uniquement"
        echo -e "${CYAN}3.${NC} Modifier le préfixe uniquement"
        echo -e "${CYAN}4.${NC} Afficher la configuration actuelle"
        echo -e "${CYAN}5.${NC} Réinstaller les dépendances"
        echo -e "${CYAN}6.${NC} Démarrer le bot"
        echo -e "${CYAN}7.${NC} Quitter"
        echo ""
        echo -ne "${YELLOW}Votre choix (1-7): ${NC}"
        read choice
        
        case $choice in
            1) interactive_setup;;
            2) modify_owner;;
            3) modify_prefix;;
            4) show_current_config;;
            5) install_npm_dependencies;;
            6) 
                echo -e "${GREEN}🚀 Démarrage du bot...${NC}"
                npm start
                ;;
            7) 
                echo -e "${GREEN}👋 Au revoir!${NC}"
                return 0
                ;;
            *) 
                echo -e "${RED}❌ Choix invalide.${NC}"
                sleep 2
                ;;
        esac
        
        if [ $choice -ne 6 ] && [ $choice -ne 7 ]; then
            echo ""
            echo -ne "${YELLOW}Appuyez sur Entrée pour continuer...${NC}"
            read
        fi
    done
}

# Modifier uniquement le propriétaire
modify_owner() {
    show_config_header
    echo -e "${PURPLE}📱 MODIFICATION DU PROPRIÉTAIRE${NC}"
    echo "─────────────────────────────────────"
    
    while true; do
        OWNER_NUMBER=$(read_with_default "Nouveau numéro du propriétaire" "237123456789")
        if validate_phone "$OWNER_NUMBER"; then
            break
        else
            echo -e "${RED}❌ Format invalide.${NC}"
        fi
    done
    
    OWNER_NAME=$(read_with_default "Nouveau nom du propriétaire" "Hisoka")
    
    if [ -f "settings.js" ]; then
        sed -i "s/number: \"[^\"]*\"/number: \"$OWNER_NUMBER\"/g" settings.js
        sed -i "s/name: \"[^\"]*\"/name: \"$OWNER_NAME\"/g" settings.js
        echo -e "${GREEN}✅ Propriétaire mis à jour!${NC}"
    else
        echo -e "${RED}❌ Fichier settings.js non trouvé.${NC}"
    fi
}

# Modifier uniquement le préfixe
modify_prefix() {
    show_config_header
    echo -e "${PURPLE}⚙️ MODIFICATION DU PRÉFIXE${NC}"
    echo "─────────────────────────────────────"
    
    while true; do
        PREFIX=$(read_with_default "Nouveau préfixe unique (un seul caractère)" ".")
        if validate_prefix "$PREFIX"; then
            break
        else
            echo -e "${RED}❌ Le préfixe doit être un seul caractère.${NC}"
        fi
    done
    
    if [ -f "settings.js" ]; then
        sed -i "s/prefix: \"[^\"]*\"/prefix: \"$PREFIX\"/g" settings.js
        echo -e "${GREEN}✅ Préfixe mis à jour!${NC}"
    else
        echo -e "${RED}❌ Fichier settings.js non trouvé.${NC}"
    fi
}

# Afficher la configuration actuelle
show_current_config() {
    show_config_header
    echo -e "${PURPLE}📋 CONFIGURATION ACTUELLE${NC}"
    echo "─────────────────────────────────────"
    
    if [ -f "settings.js" ]; then
        echo -e "${CYAN}Contenu du fichier settings.js:${NC}"
        echo ""
        cat settings.js
    else
        echo -e "${RED}❌ Aucun fichier de configuration trouvé.${NC}"
    fi
}

# Fonction principale
main() {
    show_main_header
    
    # Vérifier Termux
    check_termux
    
    # Installation des paquets système
    install_system_packages
    
    # Clonage du repository
    clone_repository
    
    # Création du package.json
    create_package_json
    
    # Installation des dépendances npm
    install_npm_dependencies
    
    # Menu de configuration
    config_menu
    
    # Instructions finales
    show_final_instructions
    
    # Menu de gestion si l'utilisateur ne démarre pas le bot
    if confirm "Accéder au menu de gestion"; then
        management_menu
    fi
}

# Démarrage du script
main