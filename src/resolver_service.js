import SteamUser from 'steam-user';
import GlobalOffensive from 'globaloffensive';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Match } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../data');
const BOT_REFRESH_TOKEN_PATH = path.join(DATA_DIR, 'bot_refresh_token.txt');

const user = new SteamUser();
const csgo = new GlobalOffensive(user);

export async function resolveNextMatch() {
    const match = await Match.findOne({ status: 'QUEUED' });
    if (!match) return;

    console.log(`[RESOLVER] Resolving share code: ${match.matchCode}`);

    try {
        csgo.requestGameMatch(match.matchCode);
    } catch (err) {
        console.error(`[RESOLVER] Error requesting match ${match.matchCode}:`, err.message);
    }
}

csgo.on('matchData', async (matchData) => {
    const matchId = matchData.matchid.toString();
    console.log(`[RESOLVER] Received match data for ID: ${matchId}`);

    const demoUrl = matchData.roundstats_all?.[matchData.roundstats_all.length - 1]?.map;

    if (demoUrl) {
        await Match.updateOne(
            { matchCode: { $exists: true }, $or: [{ matchId: matchId }, { matchCode: matchData.sharecode }] },
            {
                matchId: matchId,
                demoUrl: demoUrl,
                status: 'READY_TO_DOWNLOAD'
            }
        );
        console.log(`[RESOLVER] Match ${matchId} is now READY_TO_DOWNLOAD`);
    } else {
        console.warn(`[RESOLVER] No demo URL found for match ${matchId}`);
    }
});

export function startResolverService() {
    if (!fs.existsSync(BOT_REFRESH_TOKEN_PATH)) {
        console.error('[RESOLVER] Bot Refresh Token not found! Please run bot login first.');
        return;
    }

    const refreshToken = fs.readFileSync(BOT_REFRESH_TOKEN_PATH, 'utf8').trim();

    user.logOn({ refreshToken });

    user.on('loggedOn', () => {
        console.log('[RESOLVER] Central Bot logged into Steam');
        user.gamesPlayed([730]);
    });

    csgo.on('connectedToGC', () => {
        console.log('[RESOLVER] Central Bot connected to GC');
        setInterval(resolveNextMatch, 30 * 1000);
    });
}
