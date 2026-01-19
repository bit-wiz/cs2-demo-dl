# cs2 demo hub

this is a simple tool to grab your cs2 matchmaking demos and dump them into a telegram channel automatically. no need to manually download and upload anymore.

### what it does
- shows your last 10 matches on a nice dashboard.
- downloads, unzips, and sends the `.dem` file straight to your telegram.
- gives you a direct link to the file in your channel.

### how to set it up

1. **env**
   copy `.env.example` to `.env` and fill in your steam api key, telegram bot token, and channel id.

2. **run it**
   start the backend:
   ```bash
   pnpm start
   ```
   and the frontend:
   ```bash
   cd frontend && pnpm dev
   ```

3. **usage**
   go to the site, sign in with steam, and put in your "match authentication code" (there's a link in the UI to get it). you can just hit download after that.

   parts of it like upload to telegram doesn't work as it is work in progress .

### tech
- node.js / express
- react / tailwind
- mongodb
- gramjs (for telegram)
- steam-user / globaloffensive
