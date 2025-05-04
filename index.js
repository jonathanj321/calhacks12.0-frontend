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
app.get('/file/:filename', (req, res) => {
    const filename = req.params.filename;
    console.log('📥 Received download request for', filename);
  
    // 1) Lookup the file metadata
    gfs.files.findOne({ filename }, (err, file) => {
      if (err) {
        console.error('🔴 findOne error:', err);
        return res.status(500).send('Server error');
      }
      if (!file) {
        console.warn('⚠️  File not found in DB:', filename);
        return res.status(404).send('Not found');
      }
  
      console.log('✔️  Found file in DB:', file.filename, 'size=', file.length);
  
      // 2) Send headers so the client knows how many bytes to expect
      res.writeHead(200, {
        'Content-Type':        file.contentType,
        'Content-Length':      file.length,
        'Content-Disposition': `inline; filename="${file.filename}"`
      });
  
      // 3) Stream the chunks and explicitly end the response
      const downloadStream = gfsBucket.openDownloadStream(file._id);
      downloadStream
        .on('data',   chunk => {
          console.log(`→ Sending chunk of ${chunk.length} bytes`);
          res.write(chunk);
        })
        .on('error',  err   => {
          console.error('🔴 GridFS download error:', err);
          // If headers haven’t been sent, send a 500; otherwise just end
          if (!res.headersSent) res.sendStatus(500);
          else res.end();
        })
        .on('end',    ()    => {
          console.log('✅ All chunks sent; ending response');
          res.end();
        });
    });
  });
  
  

// ─── 6) Start the server ───────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Listening on http://localhost:${PORT}`));
