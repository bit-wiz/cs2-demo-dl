import axios from 'axios';
import { User, Match } from './db.js';

const STEAM_API_KEY = process.env.STEAM_API_KEY;

export async function checkAllUsersMatches() {
    console.log('[DISCOVERY] Checking all users for new matches...');
    const users = await User.find({ authCode: { $exists: true }, latestShareCode: { $exists: true } });

    for (const user of users) {
        try {
            await checkUserMatches(user);
        } catch (err) {
            console.error(`[DISCOVERY] Error checking matches for ${user.displayName}:`, err.message);
        }
    }
}

async function checkUserMatches(user) {
    let currentCode = user.latestShareCode;
    let foundNew = false;

    while (true) {
        const url = `https://api.steampowered.com/ICSGOPlayers_730/GetNextMatchSharingCode/v1?key=${STEAM_API_KEY}&steamid=${user.steamId64}&steamidkey=${user.authCode}&knowncode=${currentCode}`;

        const response = await axios.get(url);

        if (response.status === 200 && response.data.result && response.data.result.nextcode && response.data.result.nextcode !== 'n/a') {
            const nextCode = response.data.result.nextcode;
            console.log(`[DISCOVERY] Found new match for ${user.displayName}: ${nextCode}`);

            await Match.findOneAndUpdate(
                { matchCode: nextCode },
                {
                    matchCode: nextCode,
                    ownerSteamId: user.steamId64,
                    status: 'QUEUED'
                },
                { upsert: true }
            );

            currentCode = nextCode;
            foundNew = true;
        } else {
            break;
        }
    }

    if (foundNew) {
        await User.updateOne({ _id: user._id }, { latestShareCode: currentCode });
    }
}

export function startDiscoveryService() {
    setInterval(checkAllUsersMatches, 15 * 60 * 1000);
    checkAllUsersMatches();
}
