import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

export async function connectDB() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
}

const userSchema = new mongoose.Schema({
    steamId64: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    authCode: { type: String },
    latestShareCode: { type: String }
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);

const matchSchema = new mongoose.Schema({
    matchCode: { type: String, required: true, unique: true },
    matchId: { type: String },
    ownerSteamId: { type: String, required: true },
    demoUrl: { type: String },
    telegramId: { type: String },
    status: {
        type: String,
        enum: ['NONE', 'QUEUED', 'READY_TO_DOWNLOAD', 'DOWNLOADING', 'DOWNLOADED', 'UPLOADING', 'UPLOADED', 'FAILED'],
        default: 'NONE'
    },
    matchTime: { type: Date }
}, { timestamps: true });

export const Match = mongoose.model('Match', matchSchema);

const videoSchema = new mongoose.Schema({
    matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
    ownerSteamId: { type: String, required: true },
    videoUrl: { type: String, required: true },
    status: {
        type: String,
        enum: ['PENDING', 'READY', 'FAILED'],
        default: 'PENDING'
    }
}, { timestamps: true });

export const Video = mongoose.model('Video', videoSchema);
