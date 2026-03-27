const express = require('express');
const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

const app = express();

// Middleware
app.use(express.static(path.join(__dirname, 'static')));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database setup
const dbPath = process.env.NODE_ENV === 'production'
  ? '/var/www/journeyship/data/journeyship.db'
  : path.join(__dirname, 'data', 'journeyship.db');

let db;
let generateId;

async function initDatabase() {
  const SQL = await initSqlJs();

  // Load nanoid with custom alphabet (alphanumeric only)
  const { customAlphabet } = await import('nanoid');
  generateId = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', 12);

  // Load existing database or create new one
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables if they don't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      block TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS counters (
      id TEXT PRIMARY KEY,
      seq INTEGER NOT NULL DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS stories (
      id TEXT PRIMARY KEY,
      version INTEGER NOT NULL,
      data TEXT NOT NULL
    )
  `);

  saveDatabase();
}

function saveDatabase() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

// Helper: Get next version for a story
function getNextVersion(storyId) {
  const counterId = `story-version-${storyId}`;
  db.run(`INSERT OR IGNORE INTO counters (id, seq) VALUES (?, 0)`, [counterId]);
  db.run(`UPDATE counters SET seq = seq + 1 WHERE id = ?`, [counterId]);
  const result = db.exec(`SELECT seq FROM counters WHERE id = ?`, [counterId]);
  return result[0].values[0][0];
}

// Routes

// List available blocks for preview tool
app.get('/tools/blocks/list', (req, res) => {
  const blocksDir = path.join(__dirname, 'static', 'tools', 'blocks');
  try {
    const files = fs.readdirSync(blocksDir)
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''));
    res.json(files);
  } catch (err) {
    res.json([]);
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'views', 'index.html'));
});

// Export a block
app.post('/exportblock', (req, res) => {
  if (!req.body.block) {
    return res.status(400).send('error: no block provided');
  }

  try {
    db.run('INSERT INTO blocks (block) VALUES (?)', [req.body.block]);
    const result = db.exec('SELECT last_insert_rowid() as id');
    const id = result[0].values[0][0];
    saveDatabase();

    res.json({
      _id: id,
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
    const result = db.exec('SELECT id, block FROM blocks WHERE id = ?', [req.params.id]);
    if (result.length > 0 && result[0].values.length > 0) {
      const row = result[0].values[0];
      res.json({
        _id: row[0],
        block: row[1]
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
      // New story: generate nanoid, create first version
      const storyId = generateId();
      const version = 0;
      const compositeId = `${storyId}-${version}`;

      // Initialize version counter
      db.run('INSERT OR IGNORE INTO counters (id, seq) VALUES (?, 0)', [`story-version-${storyId}`]);

      db.run('INSERT INTO stories (id, version, data) VALUES (?, ?, ?)', [compositeId, version, req.body.story]);
      saveDatabase();

      res.json({
        _id: storyId,
        version: version,
        data: req.body.story
      });
    } else {
      // Existing story: create new version
      const storyId = req.body._id;
      const version = getNextVersion(storyId);
      const compositeId = `${storyId}-${version}`;

      db.run('INSERT INTO stories (id, version, data) VALUES (?, ?, ?)', [compositeId, version, req.body.story]);
      saveDatabase();

      res.json({
        _id: storyId,
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
    const result = db.exec('SELECT id, version, data FROM stories WHERE id = ?', [req.query._id]);
    if (result.length > 0 && result[0].values.length > 0) {
      const row = result[0].values[0];
      res.json({
        _id: row[0],
        version: row[1],
        data: row[2]
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
    const result = db.exec('SELECT id FROM stories WHERE id = ?', [compositeId]);
    if (result.length > 0 && result[0].values.length > 0) {
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
  if (db) {
    saveDatabase();
    db.close();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  if (db) {
    saveDatabase();
    db.close();
  }
  process.exit(0);
});

const PORT = process.env.PORT || 3000;

initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Journeyship running at http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
