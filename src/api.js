import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as SteamStrategy } from 'passport-steam';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { connectDB, User, Match } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(session({
    secret: 'cs2-demo-service-secret',
    resave: true,
    saveUninitialized: true,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000
    }
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

const STEAM_API_KEY = process.env.STEAM_API_KEY;

passport.use(new SteamStrategy({
    returnURL: `http://localhost:${PORT}/auth/steam/return`,
    realm: `http://localhost:${PORT}/`,
    apiKey: STEAM_API_KEY
}, async (identifier, profile, done) => {
    try {
        await User.findOneAndUpdate(
            { steamId64: profile.id },
            { steamId64: profile.id, displayName: profile.displayName },
            { upsert: true, new: true }
        );
        return done(null, profile);
    } catch (err) {
        return done(err);
    }
}));

app.use(passport.initialize());
app.use(passport.session());

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', FRONTEND_URL);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.get('/auth/steam', passport.authenticate('steam'));

app.get('/auth/steam/return', passport.authenticate('steam', { failureRedirect: '/' }), (req, res) => {
    res.redirect(FRONTEND_URL);
});

app.get('/auth/logout', (req, res) => {
    req.logout((err) => {
        if (err) return res.status(500).json({ error: 'Logout failed' });
        res.json({ message: 'Logged out' });
    });
});

app.get('/api/user', (req, res) => {
    if (req.isAuthenticated()) {
        res.json(req.user);
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

app.post('/api/user/settings', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });

    const { authCode, latestShareCode } = req.body;
    try {
        await User.findOneAndUpdate(
            { steamId64: req.user.id },
            { authCode, latestShareCode },
            { upsert: true }
        );
        res.json({ message: 'Settings updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/matches/history', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });

    const user = await User.findOne({ steamId64: req.user.id });
    if (!user || !user.authCode || !user.latestShareCode) {
        return res.status(400).json({ error: 'Auth settings missing' });
    }

    try {
        const STEAM_API_KEY = process.env.STEAM_API_KEY;
        let matches = [];
        let currentCode = user.latestShareCode;

        for (let i = 0; i < 10; i++) {
            const url = `https://api.steampowered.com/ICSGOPlayers_730/GetNextMatchSharingCode/v1?key=${STEAM_API_KEY}&steamid=${user.steamId64}&steamidkey=${user.authCode}&knowncode=${currentCode}`;
            const response = await axios.get(url);

            if (response.status === 200 && response.data.result && response.data.result.nextcode && response.data.result.nextcode !== 'n/a') {
                const nextCode = response.data.result.nextcode;

                const dbMatch = await Match.findOne({ matchCode: nextCode });

                matches.push({
                    matchCode: nextCode,
                    status: dbMatch ? dbMatch.status : 'NONE',
                    telegramId: dbMatch ? dbMatch.telegramId : null
                });
                currentCode = nextCode;
            } else {
                break;
            }
        }

        res.json({ matches, channelId: process.env.TELEGRAM_CHANNEL_ID });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/matches/request', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });

    const { matchCode } = req.body;
    try {
        await Match.findOneAndUpdate(
            { matchCode },
            {
                matchCode,
                ownerSteamId: req.user.id,
                status: 'QUEUED'
            },
            { upsert: true }
        );
        res.json({ message: 'Match queued' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export function startApi() {
    app.listen(PORT, () => {
        console.log(`API Server running at http://localhost:${PORT}`);
    });
}
