import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import postgres from 'postgres';
import { DefaultAzureCredential } from '@azure/identity';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

console.log('Starting server...');
console.log('AZURE_DATABASE_URL:', process.env.AZURE_DATABASE_URL ? 'Set' : 'Not set');
console.log('AZURE_DATABASE_USER:', process.env.AZURE_DATABASE_USER ? 'Set' : 'Not set');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');

// Database connection
let sql = null;

async function getDatabaseConnection() {
  if (sql) return sql;

  const connectionString = process.env.AZURE_DATABASE_URL;
  const databaseUser = process.env.AZURE_DATABASE_USER;
  const appName = process.env.APP_NAME;
  const databasePassword = process.env.AZURE_DATABASE_PASSWORD;

  if (!connectionString) {
    console.warn('AZURE_DATABASE_URL not set - running in development mode without database');
    return null; // Return null for development mode
  }

  const connUrl = new URL(connectionString);
  const host = connUrl.hostname;
  const portNumber = parseInt(connUrl.port || '5432', 10);
  const database = connUrl.pathname.slice(1);
  const username = connUrl.username || databaseUser;
  const fallbackPassword = databasePassword || connUrl.password;

  try {
    console.log('Attempting Azure AD token-based authentication...');
    const credential = new DefaultAzureCredential();
    const token = await credential.getToken('https://ossrdbms-aad.database.windows.net/.default');

    if (token?.token && appName) {
      console.log('Successfully obtained Azure AD token');
      sql = postgres({
        host,
        port: portNumber,
        database,
        appName,
        password: token.token,
        ssl: { rejectUnauthorized: false },
        max: 10,
        idle_timeout: 20,
      });

      await sql`SELECT 1`;
      console.log('Database connection established successfully using Azure AD token');
      return sql;
    }

    console.warn('Azure AD token not available or no database username configured');
  } catch (e) {
    console.warn('Azure AD authentication failed, falling back to password auth:', e.message);
  }

  if (!fallbackPassword) {
    console.warn('No fallback database password configured. Database connection cannot be established.');
    return null;
  }

  console.log('Using password-based authentication');
  sql = postgres({
    host,
    port: portNumber,
    database,
    username,
    password: fallbackPassword,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idle_timeout: 20,
  });

  await sql`SELECT 1`;
  console.log('Database connection established successfully using password auth');
  return sql;
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ===== PARTICIPANTS =====
app.get('/api/participants', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Email parameter is required' });
    }

    const db = await getDatabaseConnection();
    if (!db) {
      return res.json({ data: null }); // Development mode - return null
    }

    const rows = await db`
      SELECT id, email, phone_number, full_name, rotation_pair, video_order, created_at
      FROM participants
      WHERE email = ${email}
      LIMIT 1
    `;

    res.json({ data: rows.length > 0 ? rows[0] : null });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/participants', async (req, res) => {
  try {
    const { email, phone_number, full_name, rotation_pair, video_order } = req.body;

    if (!email || !phone_number || !full_name || rotation_pair === undefined || !video_order) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const db = await getDatabaseConnection();
    if (!db) {
      return res.status(201).json({ data: { id: 'dev-' + Date.now(), ...req.body, created_at: new Date().toISOString() } }); // Development mode - mock response
    }

    const rows = await db`
      INSERT INTO participants (email, phone_number, full_name, rotation_pair, video_order)
      VALUES (${email}, ${phone_number}, ${full_name}, ${rotation_pair}, ${video_order})
      RETURNING id, email, phone_number, full_name, rotation_pair, video_order, created_at
    `;

    res.status(201).json({ data: rows[0] });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/participants/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const db = await getDatabaseConnection();
    if (!db) {
      return res.json({ data: { success: true } }); // Development mode - mock response
    }

    await db`
      DELETE FROM participants
      WHERE id = ${id}
    `;

    res.json({ data: { success: true } });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== VIDEO RESPONSES =====
app.get('/api/video-responses', async (req, res) => {
  try {
    const { participant_id } = req.query;
    if (!participant_id) {
      return res.status(400).json({ error: 'participant_id parameter is required' });
    }

    const db = await getDatabaseConnection();
    if (!db) {
      return res.json({ data: [] }); // Development mode - return empty array
    }

    const rows = await db`
      SELECT id, participant_id, video_index, was_rotated, sympathy_rating, presentation_order, created_at
      FROM video_responses
      WHERE participant_id = ${participant_id}
    `;

    res.json({ data: rows });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/video-responses', async (req, res) => {
  try {
    const { participant_id, video_index, was_rotated, sympathy_rating, presentation_order } = req.body;

    if (participant_id === undefined || video_index === undefined || was_rotated === undefined ||
        sympathy_rating === undefined || presentation_order === undefined) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const db = await getDatabaseConnection();
    if (!db) {
      return res.status(201).json({ data: { id: 'dev-' + Date.now(), ...req.body, created_at: new Date().toISOString() } }); // Development mode - mock response
    }

    const rows = await db`
      INSERT INTO video_responses (participant_id, video_index, was_rotated, sympathy_rating, presentation_order)
      VALUES (${participant_id}, ${video_index}, ${was_rotated}, ${sympathy_rating}, ${presentation_order})
      RETURNING id, participant_id, video_index, was_rotated, sympathy_rating, presentation_order, created_at
    `;

    res.status(201).json({ data: rows[0] });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/video-responses', async (req, res) => {
  try {
    const { participant_id } = req.query;
    if (!participant_id) {
      return res.status(400).json({ error: 'participant_id parameter is required' });
    }

    const db = await getDatabaseConnection();
    if (!db) {
      return res.json({ data: { success: true } }); // Development mode - mock response
    }

    await db`
      DELETE FROM video_responses
      WHERE participant_id = ${participant_id}
    `;

    res.json({ data: { success: true } });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Fallback to index.html for SPA routing
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  if (sql) {
    await sql.end();
  }
  process.exit(0);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`✓ Server running at http://0.0.0.0:${port}`);
});
