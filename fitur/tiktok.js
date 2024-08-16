const axios = require('axios');

module.exports = {
    name: 'tiktok',
    alias: ['tt', 'ttdl', 'tiktokdl'],
    description: 'Unduh video TikTok',
    async execute(sock, m, args) {
        if (args.length === 0) {
            return sock.sendMessage(m.key.remoteJid, { text: 'Mohon sertakan URL TikTok.' });
        }

        const url = args[0];
        const apiUrl = `https://skizo.tech/api/tiktok?apikey=Mamah&url=${encodeURIComponent(url)}`;

        try {
            const response = await axios.get(apiUrl);
            const data = response.data.data;

            if (data && data.hdplay && data.title) {
                const caption = `*${data.title}*\n\nUnduh video dari link di atas.`;
                await sock.sendMessage(m.key.remoteJid, { video: { url: data.hdplay }, caption });

            } else {
                await sock.sendMessage(m.key.remoteJid, { text: 'Maaf, tidak dapat mengambil informasi video.' });
            }
        } catch (error) {
            console.error('Error:', error);
            await sock.sendMessage(m.key.remoteJid, { text: 'Terjadi kesalahan saat mengunduh video.' });
        }
    }
};