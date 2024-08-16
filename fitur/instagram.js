const axios = require('axios');

module.exports = {
    name: 'instagram',
    alias: ['ig', 'igdl', 'instagramdl'],
    description: 'Unduh media Instagram',
    async execute(sock, m, args) {
        let key = m.key;
        
        if (args.length === 0) {
            return sock.sendMessage(m.key.remoteJid, { text: 'Mohon sertakan URL Instagram.' });
        }

        const url = args[0];
        const apiUrl = `https://ai.xterm.codes/api/downloader/instagram?url=${encodeURIComponent(url)}`;

        try {
            await sock.sendMessage(m.key.remoteJid, { react:{ text: "🕐", key }});
            const response = await axios.get(apiUrl);
            const data = response.data.data;
            
            if (data && data.content && data.content.length > 0) {
                const caption = `*${data.title || 'Instagram Post'}*\n\n❤️ ${data.likes} | 💬 ${data.comments} | 🕒 ${data.postingTime}\n\nDari: ${data.accountName}\nLink: ${data.postUrl}`;
                
                for (const item of data.content) {
                    if (item.type === 'image' || item.type === 'video') {
                        await sock.sendMessage(m.key.remoteJid, { react:{ text: "🕒", key }});
                        await sock.sendMediaUrl(m.key.remoteJid, {  url: item.url, caption })
                    }
                }
                await sock.sendMessage(m.key.remoteJid, { react:{ text: "✅", key }});
            } else {
                await sock.sendMessage(m.key.remoteJid, { text: 'Maaf, tidak dapat mengambil informasi media.' });
            }
        } catch (error) {
            console.error('Error:', error);
            await sock.sendMessage(m.key.remoteJid, { text: 'Terjadi kesalahan saat mengunduh media.' });
        }
    }
};
