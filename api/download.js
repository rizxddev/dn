const axios = require('axios');
const cheerio = require('cheerio');
const Savetube = require('../lib/savetube');

const st = new Savetube();

async function fetchOn4t(userUrl) {
    const initialUrl = 'https://on4t.com/online-video-downloader';
    const downloadUrl = 'https://on4t.com/all-video-download';

    const headers = { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10)' };
    const initialRes = await axios.get(initialUrl, { headers });
    const $ = cheerio.load(initialRes.data);
    const csrfToken = $('meta[name="csrf-token"]').attr('content');
    const cookies = initialRes.headers['set-cookie']?.join('; ');

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

// Export default function untuk Vercel
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { url, format } = req.body;
    if (!url) return res.status(400).json({ error: 'URL harus diisi' });

    try {
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
        } else {
            const results = await fetchOn4t(url);
            res.json({ success: true, results });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
