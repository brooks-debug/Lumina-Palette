import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const DB_FILE = path.join(process.cwd(), 'db.json');

// Ensure directories exist
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ images: [], settings: { brandingUrl: null } }));
}

// Ensure DB has settings object if it was created earlier
const currentDb = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
if (!currentDb.settings) {
  currentDb.settings = { brandingUrl: null };
  fs.writeFileSync(DB_FILE, JSON.stringify(currentDb, null, 2));
}

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

async function startServer() {
  const app = express();
  app.use(express.json());

  // API: Get settings
  app.get('/api/settings', (req, res) => {
    try {
      const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      res.json(db.settings || { brandingUrl: null });
    } catch (error) {
      res.status(500).json({ error: 'Failed to read settings' });
    }
  });

  // API: Update branding image
  app.post('/api/settings/branding', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

    try {
      const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      db.settings = db.settings || {};
      
      // Clean up old branding file if it exists
      if (db.settings.brandingUrl) {
        const oldPath = path.join(process.cwd(), db.settings.brandingUrl);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      db.settings.brandingUrl = `/uploads/${req.file.filename}`;
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
      res.json(db.settings);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update branding' });
    }
  });

  // API: Get all images
  app.get('/api/images', (req, res) => {
    console.log('GET /api/images');
    try {
      const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      res.json(db.images || []);
    } catch (error) {
      console.error('Error reading DB:', error);
      res.status(500).json({ error: 'Failed to read database' });
    }
  });

  // API: Upload image
  app.post('/api/images', (req, res, next) => {
    console.log('POST /api/images started');
    next();
  }, upload.single('image'), (req, res) => {
    console.log('POST /api/images upload finished', req.file);
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

    try {
      const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      const newImage = {
        id: Math.random().toString(36).substring(7),
        url: `/uploads/${req.file.filename}`,
        name: req.file.originalname,
        size: req.file.size,
        timestamp: Date.now(),
      };

      db.images = db.images || [];
      db.images.unshift(newImage);
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
      res.json(newImage);
    } catch (error) {
      console.error('Error saving image metadata:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // API: Delete image
  app.delete('/api/images/:id', (req, res) => {
    const id = req.params.id;
    console.log(`DELETE /api/images/${id}`);
    try {
      const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      db.images = db.images || [];
      const imageToDelete = db.images.find((img: any) => img.id === id);

      if (imageToDelete) {
        const fileName = path.basename(imageToDelete.url);
        const filePath = path.join(UPLOADS_DIR, fileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        db.images = db.images.filter((img: any) => img.id !== id);
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
        res.sendStatus(200);
      } else {
        res.status(404).json({ error: 'Image not found' });
      }
    } catch (error) {
      console.error('Delete error:', error);
      res.status(500).json({ error: 'Failed to delete image' });
    }
  });

  // API 404 Handler - MUST be before Vite
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API route ${req.method} ${req.url} not found` });
  });

  // Serve static uploads
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
