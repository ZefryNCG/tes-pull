const axios = require('axios');

module.exports = {
    name: 'tes5',
    alias: ['tes6', 'tes7', 'tes8'],
    description: 'Unduh video TikTok',
    async execute(sock, m, args) {
        let key = m.key
        
        if (args.length === 0) {
            return sock.sendMessage(m.key.remoteJid, { text: 'Mohon sertakan URL TikTok.' });
        }

        const url = args[0];
        const apiUrl = `https://skizo.tech/api/tiktok?apikey=Mamah&url=${encodeURIComponent(url)}`;

        try {
            await sock.sendMessage(m.key.remoteJid, { react:{ text: "🕐", key }})
            const response = await axios.get(apiUrl);
            const data = response.data.data;
            

            if (data && data.hdplay && data.title) {
                const caption = `*${data.title}*\n\nUnduh video dari link di atas.`;
                await sock.sendMessage(m.key.remoteJid, { react:{ text: "🕒", key }})
                await sock.sendMediaUrl(m.key.remoteJid, {  url: data.hdplay, caption })
                await sock.sendMessage(m.key.remoteJid, { react:{ text: "✅", key }})

            } else {
                await sock.sendMessage(m.key.remoteJid, { text: 'Maaf, tidak dapat mengambil informasi video.' });
            }
        } catch (error) {
            console.error('Error:', error);
            await sock.sendMessage(m.key.remoteJid, { text: 'Terjadi kesalahan saat mengunduh video.' });
        }
    }
};