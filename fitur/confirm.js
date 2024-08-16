const { startVerification, verifyCode } = require('../utils/verificationService');

module.exports = {
    name: 'confirm',
    description: 'Mengkonfirmasi kode verifikasi',
    async execute(sock, m, args) {
        const { remoteJid } = m.key;
        let messageText = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        
        if (args.length < 1) {
            await sock.sendMessage(remoteJid, { text: 'Mohon sertakan kode verifikasi. Contoh: !confirm 123456' });
            return;
        }

        const inputCode = args[0];
        const isValid = await verifyCode(remoteJid, inputCode);
        
        if (isValid) {
            await sock.sendMessage(remoteJid, { text: 'Verifikasi berhasil! Anda sekarang dapat menggunakan bot.' });
        } else {
            await sock.sendMessage(remoteJid, { text: 'Kode verifikasi salah. Silakan coba lagi.' });
        }
    }
};
