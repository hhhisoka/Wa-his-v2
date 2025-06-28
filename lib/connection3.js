const pkg = require('@whiskeysockets/baileys');
const {
  DisconnectReason,
  jidDecode,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
  makeWASocket
} = pkg;

const P = require('pino');

// ✅ Correction ici : timestamp retourne maintenant une chaîne valide
const logger = P(
  {
    timestamp: () => `,"time":"${new Date().toISOString()}"`,
  },
  P.destination('./wa-logs.txt')
);
logger.level = 'trace';
logger.info("✅ Logger initialisé");

const startSock = async () => {
  const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info_ak');
  const { version, isLatest } = await fetchLatestBaileysVersion();
  
  const sock = makeWASocket({
    version,
    logger,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    downloadAndProcessHistorySyncNotification: false,
    patchMessageBeforeSending: (message, jids) =>
      jids ? jids.map((jid) => ({ recipientJid: jidDecode(jid), ...message })) : message,
    connectTimeoutMs: 30000,
    keepAliveIntervalMs: 5000,
    browser: ["Windows", "Chrome", "Chrome 114.0.5735.198"],
    syncFullHistory: false,
    defaultQueryTimeoutMs: 60000,
    markOnlineOnConnect: false,
  });
  
  sock.ev.process(async (events) => {
    if (events['connection.update']) {
      const update = events['connection.update'];
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        try {
          const code = await sock.requestPairingCode("2250104610403"); // Ton numéro ici
          console.log("🔗 Code de jumelage :", code);
        } catch (error) {
          console.error("❌ Erreur de jumelage :", error);
        }
      }
      
      if (connection === 'open') {
        console.log("✅ Connecté avec succès !");
      }
      
      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
        if (shouldReconnect) {
          console.log("🔁 Reconnexion en cours...");
          startSock();
        } else {
          console.log("🚪 Déconnecté proprement.");
        }
      }
    }
    
    if (events['creds.update']) {
      await saveCreds();
    }
  });
  
  return sock;
};

startSock();