import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import dotenv from "dotenv";

dotenv.config();

const apiId = parseInt(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_HASH;
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const channelId = process.env.TELEGRAM_CHANNEL_ID;

const stringSession = new StringSession("");

export async function uploadToTelegram(filePath, fileName) {
    console.log(`[TELEGRAM] Uploading ${fileName} via Bot...`);

    const client = new TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 5,
    });

    try {
        await client.start({
            botAuthToken: botToken,
        });

        const result = await client.sendFile(channelId, {
            file: filePath,
            caption: `CS2 Demo: ${fileName}`,
            workers: 3,
        });

        console.log(`[TELEGRAM] Upload successful. Message ID: ${result.id}`);
        await client.disconnect();
        return result.id.toString();
    } catch (err) {
        console.error(`[TELEGRAM] Upload failed:`, err);
        await client.disconnect();
        throw err;
    }
}
