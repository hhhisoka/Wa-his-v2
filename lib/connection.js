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

const logger = P(
  {
    timestamp: () => ({ time: new Date().toJSON() }),
  }, 
  P.destination('./wa-logs.txt')
);
logger.level = 'trace';

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
    patchMessageBeforeSending: (message, jids) => jids 
      ? jids.map((jid) => ({ recipientJid: jidDecode(jid), ...message })) 
      : message,
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
        // Remplacer ceci avec ton numéro de téléphone
        try {
          const code = await sock.requestPairingCode("2250104610403");
          console.log(code);
        } catch (error) {
          console.error("Erreur lors de l'obtention du code de jumelage :", error);
        }
      }

      if (connection === 'open') {
        console.log("Connecté avec succès");
      }
      
      if (connection === 'close') {
        // reconnect if not logged out
        if ((lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut) {
          startSock();
        } else {
          console.log('Connection fermée. Vous êtes déconnecté.');
        }
      }
    }

    // Credentials updated -- save them
    if (events['creds.update']) {
      await saveCreds();
    }
  });

  return sock;
};

startSock();