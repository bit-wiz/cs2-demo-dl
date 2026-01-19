import { LoginSession, EAuthTokenPlatformType } from 'steam-session';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import qrcode from 'qrcode-terminal';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../data');
const BOT_REFRESH_TOKEN_PATH = path.join(DATA_DIR, 'bot_refresh_token.txt');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

async function login() {
    let session = new LoginSession(EAuthTokenPlatformType.SteamClient);

    console.log('Starting Central Bot Login Session...');

    let startResult = await session.startWithQR();

    if (startResult.qrUrl) {
        console.log('Scan this QR code with the BOT account Steam Mobile App:');
        qrcode.generate(startResult.qrUrl, { small: true });
    }

    session.on('authenticated', async () => {
        console.log('Bot Authenticated successfully!');
        fs.writeFileSync(BOT_REFRESH_TOKEN_PATH, session.refreshToken);
        console.log(`Bot Token saved to ${BOT_REFRESH_TOKEN_PATH}`);
        process.exit(0);
    });

    session.on('timeout', () => {
        console.log('Login session timed out.');
        process.exit(1);
    });

    session.on('error', (err) => {
        console.error('Login error:', err.message);
        process.exit(1);
    });

    console.log('Waiting for bot authentication...');
}

login().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
