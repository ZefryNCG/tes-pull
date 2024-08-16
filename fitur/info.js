module.exports = {
    name: 'info',
    description: 'Menampilkan informasi bot',
    async execute(sock, m, args) {
        const { remoteJid } = m.key;
        const infoText = 'Bot WhatsApp ini dibuat menggunakan @whiskeysockets/baileys\n' +
                         'Dibuat oleh: [Nama Anda]\n' +
                         'Versi: 1.0.0';
        await sock.sendMessage(remoteJid, { text: infoText });
    }
};