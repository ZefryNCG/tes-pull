const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const axios = require('axios');
const readline = require("readline");
const { messageHandler } = require('./utils/messageHandler2');

const question = (text) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => {
        rl.question(text, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
};

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
    });

    // Function to update status profile dynamically
    const updateStatus = () => {
        let elapsedTime = 0;
    
        setInterval(async () => {
            elapsedTime++;
            const status = `aktif selama ${elapsedTime} detik`;
    
            try {
                if (elapsedTime % 30 === 0) { // Update status every 30 seconds
                    await sock.updateProfileStatus(status);
                }
            } catch (error) {
                if (error.data === 429) {
                    console.log('Rate limit exceeded. Waiting before retrying...');
                    await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute
                } else {
                    console.error('Error updating status:', error);
                }
            }
        }, 1000);
    };

    // Function to send media from URL
    sock.sendMediaUrl = async (id, { url, caption }) => {
        let get = await axios.get(url);
        let c = get.headers['content-type'];
        let type = c.split("/")[0];
        await sock.sendMessage(id, { [type]: { url }, caption });
    };

    // Function to send a reaction
    sock.sendReact = async (jid, emoticon, keys = {}) => {
        const reactionMessage = {
            react: {
                text: emoticon,
                key: keys
            }
        };
        return await sock.sendMessage(jid, reactionMessage);
    };

    // Register the phone number if not registered
    if (!sock.authState.creds.registered) {
        const phoneNumber = await question('Masukan Nomer Yang Aktif Awali Dengan 62 :\n');
        let code = await sock.requestPairingCode(phoneNumber);
        code = code?.match(/.{1,4}/g)?.join("-") || code;
        console.log(`CODE PAIRING:`, code);
    }

    // Handle connection updates
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom &&
                lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut);
            console.log('Koneksi terputus karena', lastDisconnect.error, ', reconnect', shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('Koneksi terbuka');
            // Start updating status when connection is open
            updateStatus();
        }
    });

    // Save credentials when updated
    sock.ev.on('creds.update', saveCreds);

    // Handle incoming messages
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message) return;
        await messageHandler(sock, m);
    });
}

connectToWhatsApp();
