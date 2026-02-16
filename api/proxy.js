const axios = require('axios');
const https = require('https');

export default async function handler(req, res) {
    const { url, filename } = req.query;

    if (!url) return res.status(400).send('No URL provided');

    try {
        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'stream',
            // Menambahkan agent untuk mengabaikan error SSL jika ada
            httpsAgent: new https.Agent({ rejectUnauthorized: false }),
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
                // KUNCI: Menambahkan referer agar server sumber (IG/FB/TikTok) tidak memblokir
                'Referer': new URL(url).origin,
                'Accept': '*/*'
            },
            // Timeout 15 detik agar tidak menggantung terlalu lama
            timeout: 15000 
        });

        // Set header download
        res.setHeader('Content-Disposition', `attachment; filename="${filename || 'nexdown_video'}.mp4"`);
        res.setHeader('Content-Type', 'video/mp4');

        // Mengirimkan stream data ke browser
        response.data.pipe(res);

        // Menangani error saat proses streaming (misal: koneksi terputus)
        response.data.on('error', (err) => {
            console.error('Stream Error:', err);
            res.end();
        });

    } catch (error) {
        console.error('Proxy Fatal Error:', error.message);
        // Memberikan respon yang lebih jelas jika gagal
        res.status(500).send(`Gagal mengambil data: ${error.message}`);
    }
}
