const fs = require('fs');
const path = require('path');
const { prefix } = require('../config');

const comandos = new Map();
const fiturPath = path.join(__dirname, '..', 'fitur');

fs.readdirSync(fiturPath).forEach((file) => {
    if (file.endsWith('.js')) {
        const comando = require(path.join(fiturPath, file));
        comandos.set(comando.name, comando);
    }
});

async function messageHandler(sock, m) {
    const { remoteJid } = m.key;
    const messageContent = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
    
    if (!messageContent.startsWith(prefix)) return;

    const [cmd, ...args] = messageContent.slice(prefix.length).trim().split(' ');
    const comando = comandos.get(cmd);

    if (comando) {
        try {
            await comando.execute(sock, m, args);
        } catch (error) {
            console.error(`Error executing command ${cmd}:`, error);
            await sock.sendMessage(remoteJid, { text: 'Terjadi kesalahan saat menjalankan perintah.' });
        }
    }
}

module.exports = { messageHandler };