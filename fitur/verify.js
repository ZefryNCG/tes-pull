const { startVerification, verifyCode } = require('../utils/verificationService');

module.exports = {
    name: 'verify',
    description: 'Memulai proses verifikasi email',
    async execute(sock, m, args) {
        const { remoteJid } = m.key;
        let messageText = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        
        if (args.length < 1) {
            await sock.sendMessage(remoteJid, { text: 'Mohon sertakan alamat email Anda. Contoh: !verify user@example.com' });
            return;
        }

        const email = args[0];
        try {
            await startVerification(remoteJid, email);
            await sock.sendMessage(remoteJid, { text: `Kode verifikasi telah dikirim ke ${email}. Balas dengan: !confirm <kode>` });
        } catch (error) {
            console.error(error);
            await sock.sendMessage(remoteJid, { text: 'Terjadi kesalahan saat memulai verifikasi. Silakan coba lagi.' });
        }
    }
};
