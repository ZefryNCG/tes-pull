const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const path = require('path');
const fs = require('fs');
const { messageHandler } = require('./utils/messageHandler2');
const readline = require("readline");
const axios = require('axios');
const { isVerified } = require('./utils/verificationService');  // Import fungsi verifikasi
const config = require('./config');

const question = (text) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => {
        rl.question(text, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
};

async function handleVerification(sock, msg) {
    const sender = msg.key.remoteJid;
    const messageText = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
    
    if (!messageText.startsWith(config.prefix)) return true;

    const [cmd, ...args] = messageText.slice(config.prefix.length).trim().split(' ');
    
    if (cmd !== 'verify' && cmd !== 'confirm') {
        const verified = await isVerified(sender);
        if (!verified) {
            await sock.sendMessage(sender, { text: 'Mohon verifikasi email Anda terlebih dahulu dengan mengirim !verify <email>' });
            return false;
        }
    }

    return true;
}

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys2');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
    });

    sock.sendMediaUrl = async (id, { url, caption }) => {
        let get = await axios.get(url);
        let c = get.headers['content-type'];
        let type = c.split("/")[0];
        if (!["image", "video", "audio", "text"].includes(type)) type = "document";
        await sock.sendMessage(id, { [type]: { url }, caption });
        return type;
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

    if (!sock.authState.creds.registered) {
        const phoneNumber = await question('Masukan Nomer Yang Aktif Awali Dengan 62 :\n');
        let code = await sock.requestPairingCode(phoneNumber);
        code = code?.match(/.{1,4}/g)?.join("-") || code;
        console.log(`CODE PAIRING :`, code);
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom &&
                lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut);
            console.log('Koneksi terputus karena ', lastDisconnect.error, ', reconnect ', shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('Koneksi terbuka');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message) return;

        const isVerifiedUser = await handleVerification(sock, m);  // Tambahkan pengecekan verifikasi di sini
        if (isVerifiedUser) {
            await messageHandler(sock, m);
        }
    });
}

connectToWhatsApp();
