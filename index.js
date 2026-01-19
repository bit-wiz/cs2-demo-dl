import { connectDB } from './src/db.js';
import { startApi } from './src/api.js';
import { startService } from './src/service.js';
import { startDiscoveryService } from './src/discovery_service.js';
import { startResolverService } from './src/resolver_service.js';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
    console.log('Starting CS2 Multi-User Platform Services...');

    await connectDB();
    startApi();
    // startDiscoveryService();
    startResolverService();
    startService();
}

main().catch(err => {
    console.error('Failed to start services:', err);
    process.exit(1);
});
