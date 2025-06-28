import pkg from '@whiskeysockets/baileys';
import { makeWASocket } from '@whiskeysockets/baileys';
const { DisconnectReason, jidDecode, fetchLatestBaileysVersion, getContentType, makeCacheableSignalKeyStore, useMultiFileAuthState } = pkg;
import P from 'pino'


const logger = P({ timestamp: () => , "time": "${new Date().toJSON()}" }, P.destination('./wa-logs.txt'))
logger.level = 'trace'

// start a connection
const startSock = async () => {
  const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info_ak')
  
  const { version, isLatest } = await fetchLatestBaileysVersion()
  
  
  const sock = makeWASocket({
    version,
    logger,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    downloadAndProcessHistorySyncNotification: false,
    patchMessageBeforeSending: (message, jids) => jids ? jids.map((jid) => ({ recipientJid: jid, ...message })) : message,
    connectTimeoutMs: 30000,
    keepAliveIntervalMs: 5000,
    browser: ["Windows", "Chrome", "Chrome 114.0.5735.198"],
    syncFullHistory: false,
    defaultQueryTimeoutMs: 60000,
    markOnlineOnConnect: false,
  })
  
  sock.ev.process(
    // events is a map for event name => event data
    async (events) => {
      if (events['connection.update']) {
        const update = events['connection.update']
        const { connection, lastDisconnect, qr } = update
        
        if (qr) {
          // remplacez ceci avec ton numero de telephone
          sock.requestPairingCode("2250104610403").then((code) => {
            console.log(code);
          })
        }
        if (connection === 'open') {
          console.log("connecter avec success")
        }
        if (connection === 'close') {
          // reconnect if not logged out
          if ((lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut) {
            startSock()
          } else {
            console.log('Connection closed. You are logged out.')
          }
        }
        
      }
      
      // credentials updated -- save them
      if (events['creds.update']) {
        await saveCreds()
        
      }
    },
  )
  
  return sock
  
}

startSock()