const { prefix } = require('../config');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'help',
    description: 'Menampilkan daftar perintah',
    async execute(sock, m, args) {
        const { remoteJid } = m.key;
        const fiturPath = path.join(__dirname);
        let helpText = 'Daftar perintah:\n\n';

        fs.readdirSync(fiturPath).forEach((file) => {
            if (file.endsWith('.js')) {
                const comando = require(path.join(fiturPath, file));
                if (comando.name && comando.description) {
                    helpText += `${prefix}${comando.name}: ${comando.description}\n`;
                }
            }
        });

        await sock.sendMessage(remoteJid, { text: helpText });
    }
};