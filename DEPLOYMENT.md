# Hisoka-md/his-v0 - Options de Déploiement

## 🚀 Sites de Déploiement Recommandés

### 1. **Replit** (Recommandé)
- **Avantages**: Gratuit, facile à utiliser, support Node.js natif
- **Étapes**:
  1. Créer un compte sur replit.com
  2. Importer ce projet via GitHub ou upload direct
  3. Configurer les variables d'environnement
  4. Cliquer sur "Run"
- **URL**: https://replit.com

### 2. **Railway**
- **Avantages**: Déploiement automatique, bon support Node.js
- **Plan gratuit**: 500 heures/mois
- **Étapes**:
  1. Connecter votre compte GitHub à Railway
  2. Déployer depuis le repository
  3. Configurer les variables d'environnement
- **URL**: https://railway.app

### 3. **Render**
- **Avantages**: SSL gratuit, déploiement Git automatique
- **Plan gratuit**: Limité mais suffisant pour les tests
- **Étapes**:
  1. Créer un compte sur Render
  2. Connecter votre repository GitHub
  3. Configurer comme service Web
- **URL**: https://render.com

### 4. **Heroku**
- **Avantages**: Plateforme mature, beaucoup de documentation
- **Note**: Plus de plan gratuit depuis novembre 2022
- **Plan payant**: À partir de $7/mois
- **URL**: https://heroku.com

### 5. **Glitch**
- **Avantages**: Gratuit, interface simple
- **Limitations**: Projet s'endort après inactivité
- **Étapes**:
  1. Importer depuis GitHub sur glitch.com
  2. Configurer les variables d'environnement
- **URL**: https://glitch.com

### 6. **Koyeb**
- **Avantages**: Plan gratuit généreux
- **Plan gratuit**: 512MB RAM, déploiement Git
- **URL**: https://koyeb.com

## 📱 Installation Termux (Android)

### Prérequis
- Termux app installé depuis F-Droid ou Google Play
- Connexion internet stable
- Au moins 1GB d'espace libre

### Installation Rapide
```bash
# Télécharger et exécuter le script d'installation
curl -O https://raw.githubusercontent.com/votre-repo/hisoka-bot/main/termux.sh
chmod +x termux.sh
./termux.sh
```

### Installation Manuelle
```bash
# 1. Mettre à jour Termux
pkg update && pkg upgrade -y

# 2. Installer Node.js et les outils requis
pkg install -y nodejs npm git ffmpeg imagemagick

# 3. Cloner le projet
git clone https://github.com/votre-repo/hisoka-bot.git
cd hisoka-bot

# 4. Installer les dépendances
npm install

# 5. Configurer le bot
nano settings.js

# 6. Démarrer le bot
npm start
```

## ⚙️ Configuration Requise

### Variables d'Environnement
```bash
# Optionnel - Personnalisation
PREFIX=.                    # Préfixe des commandes (par défaut: .)
BOT_NUMBER=628000000000    # Numéro du bot WhatsApp
OWNER_NUMBER=628000000000  # Numéro du propriétaire
```

### Fichiers Requis
- `settings.js` - Configuration du bot
- `session/` - Dossier pour les données de session WhatsApp
- `temp/` - Dossier temporaire pour le traitement des médias
- `database/` - Stockage des données du bot

## 🔧 Conseils de Déploiement

### Pour Replit
1. Ajouter un fichier `.replit` avec:
```toml
run = "node index.js"
language = "nodejs"
```

### Pour Railway/Render
1. Ajouter un `Procfile`:
```
web: node index.js
```

### Pour tous les déploiements
1. **Toujours** configurer les variables d'environnement
2. S'assurer que FFmpeg est disponible (pour les fonctions sticker)
3. Tester d'abord en local avec `npm start`
4. Garder le bot actif avec un service comme UptimeRobot

## 📞 Support

- **Créateur**: @hhhisoka
- **Repository**: [Lien vers votre repo GitHub]
- **Issues**: Utiliser la section Issues du repository

## 🎯 Fonctionnalités Disponibles

✅ **Activées**:
- Gestion d'administration
- Commandes de groupe
- Traitement de médias et stickers
- Outils utilitaires
- Commandes d'information

❌ **Désactivées** (Focus utilité):
- Jeux et divertissement
- Système de niveaux
- Fonctionnalités premium/VIP
- Économie virtuelle