console.log('🛠️  index.js loaded, setting up routes…');


require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const multer  = require('multer');
const fs      = require('fs');
const { MongoClient, GridFSBucket } = require('mongodb');
const Grid    = require('gridfs-stream');

const app    = express();
app.use(cors());                   // enable CORS for frontend access
const upload = multer({ dest: 'uploads/' });

let gfs, gfsBucket;

// ─── 1) Connect & init GridFS ───────────────────────────────────────────────
MongoClient.connect(process.env.MONGO_URI)
  .then(client => {
    const db        = client.db();
    gfsBucket       = new GridFSBucket(db, { bucketName: 'pdfs' });
    gfs             = Grid(db, MongoClient);
    gfs.collection('pdfs');
    console.log('✅ Connected to MongoDB');
  })
  .catch(err => {
    console.error('❌ Mongo connection error:', err);
    process.exit(1);
  });

// ─── 2) Health check ─────────────────────────────────────────────────────────
app.get('/', (_req, res) => res.send('Server is up'));

// ─── 3) Upload endpoint ───────────────────────────────────────────────────────
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const { originalname, mimetype, path: tempPath } = req.file;
  const uploadStream = gfsBucket.openUploadStream(originalname, {
    contentType: mimetype,
    metadata: { uploadedAt: new Date() }
  });
  const fileId = uploadStream.id;

  fs.createReadStream(tempPath)
    .pipe(uploadStream)
    .on('error', err => {
      console.error('🔴 GridFS upload error:', err);
      res.sendStatus(500);
    })
    .on('finish', () => {
      fs.unlink(tempPath, unlinkErr => {
        if (unlinkErr) console.error('Temp file cleanup error:', unlinkErr);
      });
      res.json({ fileId, filename: originalname });
    });
});

// ─── 4) List metadata ─────────────────────────────────────────────────────────
// ─── Download & stream a file by filename ────────────────────────────────────
// ─── 5) Download & stream a file by filename (simplified) ────────────────
app.get('/file/:filename', async (req, res) => {
    const filename = req.params.filename;
    console.log('📥 Download requested for', filename);
  
    try {
      // 1) Find the file document via the bucket
      const files = await gfsBucket.find({ filename }).toArray();
      if (!files || files.length === 0) {
        console.warn('⚠️  File not found in DB:', filename);
        return res.status(404).send('Not found');
      }
      const file = files[0];
      console.log('✔️  Found file in DB:', file.filename, 'size=', file.length);
  
      // 2) Set the headers up front
      res.setHeader('Content-Type',        file.contentType);
      res.setHeader('Content-Length',      file.length);
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${file.filename}"`
      );
  
      // 3) Open the download stream and pipe it directly to res
      const downloadStream = gfsBucket.openDownloadStream(file._id);
      downloadStream
        .on('error', err => {
          console.error('🔴 GridFS download error:', err);
          // If headers already sent, just close; otherwise send 500
          if (!res.headersSent) res.sendStatus(500);
          else res.end();
        })
        .pipe(res);  // pipe will end res for you once the stream ends
  
    } catch (err) {
      console.error('❌ Error in download handler:', err);
      if (!res.headersSent) res.sendStatus(500);
      else res.end();
    }
  });
  
  
  

// ─── 6) Start the server ───────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Listening on http://localhost:${PORT}`));
