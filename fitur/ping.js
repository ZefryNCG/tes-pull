module.exports = {
    name: 'ping',
    description: 'Mengecek ping bot',
    async execute(sock, m, args) {
        const { remoteJid } = m.key;
        const start = new Date();
        await sock.sendMessage(remoteJid, { text: 'Pong!' });
        const end = new Date();
        const ping = end - start;
        await sock.sendMessage(remoteJid, { text: `Ping: ${ping}ms` });
    }
};