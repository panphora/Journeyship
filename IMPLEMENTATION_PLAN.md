# Journeyship: SQLite Migration & Deployment Plan

This document provides step-by-step instructions to migrate from MongoDB to SQLite and deploy to production.

---

## Overview

| What | Current | Target |
|------|---------|--------|
| Database | MongoDB 1.3.x | SQLite (better-sqlite3) |
| Node.js | 0.8.x | 18.x+ |
| Express | 3.x | 4.x |
| Server | - | hyperclay:/var/www/journeyship |
| Domain | - | journeyship.com |

---

## Phase 1: Update Dependencies

### Step 1.1: Update package.json

Replace the entire `package.json` with:

```json
{
  "name": "journeyship",
  "description": "a drawing and animation app",
  "version": "2.0.0",
  "private": true,
  "type": "commonjs",
  "dependencies": {
    "express": "^4.18.2",
    "better-sqlite3": "^9.4.3"
  },
  "scripts": {
    "start": "node server.js"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

**What changed:**
- `express`: 3.x → 4.18.2 (major update)
- `mongodb`: removed
- `better-sqlite3`: added (synchronous SQLite driver)
- `node`: 0.8.x → 18.0.0+

### Step 1.2: Install dependencies locally

```bash
rm -rf node_modules package-lock.json
npm install
```

---

## Phase 2: Rewrite server.js for SQLite

### Step 2.1: Replace server.js entirely

Replace the entire contents of `server.js` with:

```javascript
const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();

// Middleware
app.use(express.static(path.join(__dirname, 'static')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database setup
const dbPath = process.env.NODE_ENV === 'production'
  ? '/var/www/journeyship/data/journeyship.db'
  : path.join(__dirname, 'data', 'journeyship.db');

const db = new Database(dbPath);

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS blocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    block TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS counters (
    id TEXT PRIMARY KEY,
    seq INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS stories (
    id TEXT PRIMARY KEY,
    version INTEGER NOT NULL,
    data TEXT NOT NULL
  );
`);

// Initialize the storyId counter if it doesn't exist
const initCounter = db.prepare(`
  INSERT OR IGNORE INTO counters (id, seq) VALUES (?, ?)
`);
initCounter.run('storyId', 0);

// Prepared statements for better performance
const insertBlock = db.prepare('INSERT INTO blocks (block) VALUES (?)');
const getBlock = db.prepare('SELECT * FROM blocks WHERE id = ?');

const insertStory = db.prepare('INSERT INTO stories (id, version, data) VALUES (?, ?, ?)');
const getStory = db.prepare('SELECT * FROM stories WHERE id = ?');

const getCounter = db.prepare('SELECT seq FROM counters WHERE id = ?');
const incrementCounter = db.prepare(`
  UPDATE counters SET seq = seq + 1 WHERE id = ?
`);

// Helper: Get next ID for a counter (atomic increment + return)
function getNextId(counterId) {
  const initIfNeeded = db.prepare('INSERT OR IGNORE INTO counters (id, seq) VALUES (?, 0)');
  initIfNeeded.run(counterId);
  incrementCounter.run(counterId);
  const row = getCounter.get(counterId);
  return row.seq;
}

// Routes

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'views', 'index.html'));
});

// Export a block
app.post('/exportblock', (req, res) => {
  if (!req.body.block) {
    return res.status(400).send('error: no block provided');
  }

  try {
    const result = insertBlock.run(req.body.block);
    res.json({
      _id: result.lastInsertRowid,
      block: req.body.block
    });
  } catch (err) {
    console.error('Error inserting block:', err);
    res.status(500).send('error');
  }
});

// Get a block by ID
app.get('/block/:id', (req, res) => {
  try {
    const block = getBlock.get(req.params.id);
    if (block) {
      res.json({
        _id: block.id,
        block: block.block
      });
    } else {
      res.status(404).send('block not found');
    }
  } catch (err) {
    console.error('Error getting block:', err);
    res.status(500).send('error');
  }
});

// Save a story (create new or create new version)
app.post('/savestory', (req, res) => {
  try {
    if (!req.body._id) {
      // New story: get next story ID, initialize version counter, create story
      const storyId = getNextId('storyId');
      const versionCounterId = `story-version-${storyId}`;

      // Initialize version counter at 0 (first version is 0)
      const initVersionCounter = db.prepare('INSERT OR IGNORE INTO counters (id, seq) VALUES (?, 0)');
      initVersionCounter.run(versionCounterId);

      const version = 0;
      const compositeId = `${storyId}-${version}`;

      insertStory.run(compositeId, version, req.body.story);

      res.json({
        _id: compositeId,
        version: version,
        data: req.body.story
      });
    } else {
      // Existing story: create new version
      const storyId = parseInt(req.body._id, 10);
      const versionCounterId = `story-version-${storyId}`;

      const version = getNextId(versionCounterId);
      const compositeId = `${storyId}-${version}`;

      insertStory.run(compositeId, version, req.body.story);

      res.json({
        _id: compositeId,
        version: version,
        data: req.body.story
      });
    }
  } catch (err) {
    console.error('Error saving story:', err);
    res.status(500).send('error');
  }
});

// Get a story by ID
app.get('/getstory', (req, res) => {
  try {
    const story = getStory.get(req.query._id);
    if (story) {
      res.json({
        _id: story.id,
        version: story.version,
        data: story.data
      });
    } else {
      res.status(404).json(null);
    }
  } catch (err) {
    console.error('Error getting story:', err);
    res.status(500).send('error');
  }
});

// View a story (serves index.html if story exists, 404 otherwise)
// Must be last because it's the most general pattern
app.get('/:id/:version?', (req, res) => {
  const version = req.params.version || 0;
  const compositeId = `${req.params.id}-${version}`;

  try {
    const story = getStory.get(compositeId);
    if (story) {
      res.sendFile(path.join(__dirname, 'static', 'views', 'index.html'));
    } else {
      res.status(404).sendFile(path.join(__dirname, 'static', 'views', '404.html'));
    }
  } catch (err) {
    console.error('Error checking story:', err);
    res.status(500).sendFile(path.join(__dirname, 'static', 'views', '404.html'));
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  db.close();
  process.exit(0);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Journeyship running on port ${PORT}`);
});
```

### Step 2.2: Create local data directory

```bash
mkdir -p data
echo "data/*.db" >> .gitignore
echo "data/*.db-wal" >> .gitignore
echo "data/*.db-shm" >> .gitignore
```

### Step 2.3: Test locally

```bash
npm start
```

Then visit http://localhost:3000 and test:
1. Create a new drawing
2. Save it (should get an ID like "1-0")
3. Reload the page with that ID
4. Make changes and save again (should get "1-1")

---

## Phase 3: Update Deploy Script

### Step 3.1: Update deploy.sh

Open `deploy.sh` and change these lines at the top:

**Before:**
```bash
SSH_HOST="hyperclay"
REMOTE_DIR="/var/www/build-a-web-app"
APP_NAME="buildwebapp"
```

**After:**
```bash
SSH_HOST="hyperclay"
REMOTE_DIR="/var/www/journeyship"
APP_NAME="journeyship"
```

Also update the URL at the bottom of the file:

**Before:**
```bash
echo "  - Visit: https://buildwebapp.hyperclay.com"
```

**After:**
```bash
echo "  - Visit: https://journeyship.com"
```

### Step 3.2: Update check-deployment.sh (optional)

If you want to use the check script, update these lines:

**Before:**
```bash
SSH_HOST="hyperclay"
REMOTE_DIR="/var/www/build-a-web-app"
```

**After:**
```bash
SSH_HOST="hyperclay"
REMOTE_DIR="/var/www/journeyship"
```

---

## Phase 4: Update PM2 Config

### Step 4.1: Create/Update ecosystem.config.cjs

Create or update `ecosystem.config.cjs`:

```javascript
module.exports = {
  apps: [{
    name: 'journeyship',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '256M',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

---

## Phase 5: Server Setup (run on hyperclay)

SSH into the server and run these commands:

### Step 5.1: Create application directory

```bash
sudo mkdir -p /var/www/journeyship
sudo chown -R $USER:www-data /var/www/journeyship
```

### Step 5.2: Create data directory for SQLite

```bash
sudo mkdir -p /var/www/journeyship/data
sudo chown -R www-data:www-data /var/www/journeyship/data
sudo chmod 755 /var/www/journeyship/data
```

### Step 5.3: Ensure Node 18+ is installed

```bash
node --version
```

If it shows a version less than 18, install Node 18:

```bash
# Using NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Or using nvm (if installed)
nvm install 18
nvm use 18
```

### Step 5.4: Ensure build tools for better-sqlite3

`better-sqlite3` requires compilation. Install build tools:

```bash
sudo apt-get update
sudo apt-get install -y build-essential python3
```

### Step 5.5: Configure Nginx

Create `/etc/nginx/sites-available/journeyship`:

```nginx
server {
    listen 80;
    server_name journeyship.com www.journeyship.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/journeyship /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 5.6: Set up SSL with Certbot

```bash
sudo certbot --nginx -d journeyship.com -d www.journeyship.com
```

---

## Phase 6: Deploy

### Step 6.1: Deploy from your local machine

```bash
./deploy.sh
```

This will:
1. Upload all files via rsync
2. Run `npm install` on server
3. Create data directory with correct permissions
4. Start/restart the app with PM2

### Step 6.2: Verify deployment

```bash
# Check PM2 status
ssh hyperclay 'pm2 status'

# Check logs
ssh hyperclay 'pm2 logs journeyship --lines 50'

# Check if site is responding
curl -I https://journeyship.com
```

---

## Troubleshooting

### "Cannot find module 'better-sqlite3'"

The native module wasn't compiled. SSH into server and run:

```bash
cd /var/www/journeyship
npm rebuild better-sqlite3
pm2 restart journeyship
```

### "SQLITE_CANTOPEN: unable to open database file"

The data directory doesn't exist or has wrong permissions:

```bash
sudo mkdir -p /var/www/journeyship/data
sudo chown -R www-data:www-data /var/www/journeyship/data
sudo chmod 755 /var/www/journeyship/data
pm2 restart journeyship
```

### "Error: listen EADDRINUSE: address already in use :::3000"

Another process is using port 3000:

```bash
# Find what's using the port
sudo lsof -i :3000

# Kill the old PM2 process
pm2 delete all
pm2 start ecosystem.config.cjs --env production
```

### Nginx shows 502 Bad Gateway

The Node app isn't running:

```bash
pm2 status
pm2 logs journeyship --lines 100
```

---

## File Changes Summary

| File | Action |
|------|--------|
| `package.json` | Replace entirely |
| `server.js` | Replace entirely |
| `ecosystem.config.cjs` | Create new |
| `deploy.sh` | Edit 3 lines |
| `check-deployment.sh` | Edit 2 lines (optional) |
| `.gitignore` | Add SQLite files |
| `mongo-db-info.js` | Delete (no longer needed) |

---

## Rollback Plan

If something goes wrong after deploying:

1. The MongoDB version is still in git history
2. Revert to the previous commit: `git checkout HEAD~1`
3. Redeploy with: `./deploy.sh`

---

## Testing Checklist

After deployment, verify these work:

- [ ] Homepage loads at https://journeyship.com
- [ ] Can create a new drawing
- [ ] Can save drawing (check browser console for response with `_id`)
- [ ] Can reload page and drawing persists
- [ ] Can access saved drawing via URL (e.g., /1/0)
- [ ] 404 page shows for non-existent stories
- [ ] Creating new version of story works (save existing story)
