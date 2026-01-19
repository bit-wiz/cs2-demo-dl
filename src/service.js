import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import axios from 'axios';
import bz2 from 'unbzip2-stream';
import { Match } from './db.js';
import { uploadToTelegram } from './telegram_worker.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEMOS_DIR = path.join(__dirname, '../demos');

if (!fs.existsSync(DEMOS_DIR)) {
    fs.mkdirSync(DEMOS_DIR, { recursive: true });
}

export async function startService() {
    console.log('[DOWNLOADER] Starting CS2 Downloader & Uploader Service...');
    setInterval(processPendingDownloads, 60 * 1000);
    processPendingDownloads();
}

async function processPendingDownloads() {
    const matches = await Match.find({ status: 'READY_TO_DOWNLOAD' });

    for (const match of matches) {
        try {
            await processDemo(match.matchId, match.demoUrl);
        } catch (err) {
            console.error(`[DOWNLOADER] Error processing match ${match.matchId}:`, err.message);
        }
    }
}

async function processDemo(matchId, url) {
    const bz2Path = path.join(DEMOS_DIR, `match_${matchId}.dem.bz2`);
    const demoPath = path.join(DEMOS_DIR, `match_${matchId}.dem`);

    try {
        await Match.updateOne({ matchId }, { status: 'DOWNLOADING' });

        console.log(`[DOWNLOADER] Downloading ${matchId}...`);
        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'stream'
        });

        const writer = fs.createWriteStream(bz2Path);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        console.log(`[DOWNLOADER] Decompressing ${matchId}...`);
        const readStream = fs.createReadStream(bz2Path);
        const writeStream = fs.createWriteStream(demoPath);

        await new Promise((resolve, reject) => {
            readStream.pipe(bz2().on('error', reject)).pipe(writeStream);
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
        });

        fs.unlinkSync(bz2Path);
        await Match.updateOne({ matchId }, { status: 'DOWNLOADED' });

        console.log(`[DOWNLOADER] Uploading ${matchId} to Telegram...`);
        await Match.updateOne({ matchId }, { status: 'UPLOADING' });

        const telegramId = await uploadToTelegram(demoPath, `match_${matchId}.dem`);

        await Match.updateOne({ matchId }, {
            status: 'UPLOADED',
            telegramId: telegramId
        });

        console.log(`[DOWNLOADER] Successfully processed match ${matchId}`);
        fs.unlinkSync(demoPath);

    } catch (err) {
        console.error(`[DOWNLOADER] Error processing match ${matchId}:`, err.message);
        await Match.updateOne({ matchId }, { status: 'FAILED' });
    }
}
