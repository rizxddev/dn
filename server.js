const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const Savetube = require('./lib/savetube'); // Import class savetube

const app = express();
const st = new Savetube();

app.use(express.json());
app.use(express.static('public'));

// --- Fungsi Helper untuk Scraper Umum (on4t.com) ---
async function fetchOn4t(userUrl) {
    const initialUrl = 'https://on4t.com/online-video-downloader';
    const downloadUrl = 'https://on4t.com/all-video-download';

    // 1. Get Token & Cookie
    const headers = { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10)' };
    const initialRes = await axios.get(initialUrl, { headers });
    const $ = cheerio.load(initialRes.data);
    const csrfToken = $('meta[name="csrf-token"]').attr('content');
    const cookies = initialRes.headers['set-cookie']?.join('; ');

    // 2. Post Download
    const postData = new URLSearchParams();
    postData.append('_token', csrfToken);
    postData.append('link[]', userUrl);

    const res = await axios.post(downloadUrl, postData.toString(), {
        headers: { ...headers, 'Cookie': cookies, 'X-Requested-With': 'XMLHttpRequest' }
    });

    if (res.data?.result?.length) {
        return res.data.result.map(item => ({
            title: item.title,
            thumb: item.image,
            url: item.video_file_url || item.videoimg_file_url,
            source: 'Social Media'
        }));
    }
    throw new Error('Video tidak ditemukan');
}

// --- Endpoint API ---
app.post('/api/download', async (req, res) => {
    const { url, format } = req.body;
    if (!url) return res.status(400).json({ error: 'URL harus diisi' });

    try {
        // Cek apakah ini link YouTube
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            const result = await st.download(url, format || 'mp3');
            if (result.status) {
                return res.json({ 
                    success: true, 
                    results: [{ title: result.title, url: result.dl, thumb: result.thumb }] 
                });
            } else {
                throw new Error(result.error || result.msg);
            }
        } 
        // Jika bukan YouTube, gunakan scraper umum
        else {
            const results = await fetchOn4t(url);
            res.json({ success: true, results });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server jalan di http://localhost:${PORT}`));
