const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const path = require('path');
const fs = require('fs');
const { messageHandler } = require('./utils/messageHandler2');
const readline = require("readline");

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
        printQRInTerminal: true, // QR akan ditampilkan di terminal
    });

    // Menampilkan pilihan kepada pengguna
    const choice = await question('Pilih metode koneksi:\n1. QR Code\n2. Pairing dengan nomor telepon\nPilihan Anda (1/2):\n');

    if (choice === '2') {
        // Jika pengguna memilih pairing dengan nomor telepon
        const phoneNumber = await question('Masukan Nomer Yang Aktif Awali Dengan 62 :\n');
        let code = await sock.requestPairingCode(phoneNumber);
        code = code?.match(/.{1,4}/g)?.join("-") || code;
        console.log(`CODE PAIRING :`, code);
    } else {
        // Jika pengguna memilih QR code (atau memasukkan input selain '2')
        console.log('Silakan scan QR code yang ditampilkan di terminal.');
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
        await messageHandler(sock, m);
    });
}

connectToWhatsApp();

// Fungsi untuk memperbarui file jika ada perubahan
let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(`Update ${__filename}`)
    delete require.cache[file]
    require(file)
})
