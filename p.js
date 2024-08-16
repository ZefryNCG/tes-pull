const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const axios = require('axios');

async function connectToWhatsApp(pairingMode = false, phoneNumber = null) {
    const { state, saveCreds } = await useMultiFileAuthState('syandana');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: !pairingMode,  // Only print QR if not in pairing mode
    });

    sock.sendMediaUrl = async (id, { url, caption }) => {
        let get = await axios.get(url);
        let c = get.headers['content-type'];
        let type = c.split("/")[0];
        await sock.sendMessage(id, { [type]: { url }, caption });
    };
    
    sock.sendReact = async (jid, emoticon, keys = {}) => {
        let reactionMessage = {
            react: {
                text: emoticon,
                key: keys
            }
        };
        return await sock.sendMessage(jid, reactionMessage);
    };

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom &&
                lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut);
            console.log('Koneksi terputus karena ', lastDisconnect.error, ', reconnect ', shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp(pairingMode, phoneNumber);
            }
        } else if (connection === 'open') {
            console.log('Koneksi terbuka');
            
            // Request pairing code after the connection is open
            if (pairingMode && phoneNumber) {
                let code = await sock.requestPairingCode(phoneNumber);
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                console.log(`CODE PAIRING :`, code);
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message) return;
        await messageHandler(sock, m);
    });
}

// Check for the --pairing argument and phone number
const args = process.argv.slice(2);
const pairingMode = args.includes('--pairing');
const phoneNumber = pairingMode ? args[args.indexOf('--pairing') + 1] : null;

if (pairingMode && !phoneNumber) {
    console.log('Please provide a phone number with the --pairing option');
    process.exit(1);
}

connectToWhatsApp(pairingMode, phoneNumber);
