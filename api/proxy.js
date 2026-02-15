// api/proxy.js
const axios = require('axios');

export default async function handler(req, res) {
    const { url, filename } = req.query;

    if (!url) return res.status(400).send('No URL provided');

    try {
        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
            }
        });

        // Set header agar browser menganggap ini file download
        res.setHeader('Content-Disposition', `attachment; filename="${filename || 'video'}.mp4"`);
        res.setHeader('Content-Type', 'video/mp4');

        // Pipa data dari axios langsung ke response Express/Vercel
        response.data.pipe(res);
    } catch (error) {
        console.error('Proxy Error:', error.message);
        res.status(500).send('Failed to fetch video');
    }
}

