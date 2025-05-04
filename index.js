console.log('🛠️  index.js loaded, setting up routes…');


require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const multer  = require('multer');
const fs      = require('fs');
const { MongoClient, GridFSBucket } = require('mongodb');
const Grid    = require('gridfs-stream');
const { splitPDFIntoQuestions, saveSplitPDFs } = require('./pdfSplitter');

const app    = express();
app.use(cors());                   // enable CORS for frontend access
const upload = multer({ dest: 'uploads/' });

// Debug routes
console.log('Setting up routes...');

// Serve static files
app.use(express.static(__dirname));

// Serve the test page - original route
app.get('/test', (req, res) => {
    console.log('TEST route accessed!');
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>PDF Splitter Test</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }
            .form-container {
                border: 1px solid #ccc;
                padding: 20px;
                border-radius: 5px;
            }
            .result {
                margin-top: 20px;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 5px;
                white-space: pre-wrap;
            }
        </style>
    </head>
    <body>
        <h1>PDF Splitter Test</h1>
        <div class="form-container">
            <form id="uploadForm">
                <input type="file" id="pdfFile" accept=".pdf" required>
                <button type="submit">Upload and Split</button>
            </form>
        </div>
        <div id="result" class="result"></div>

        <script>
            document.getElementById('uploadForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const resultDiv = document.getElementById('result');
                const fileInput = document.getElementById('pdfFile');
                
                if (!fileInput.files.length) {
                    resultDiv.textContent = 'Please select a file';
                    return;
                }

                const formData = new FormData();
                formData.append('file', fileInput.files[0]);

                try {
                    resultDiv.textContent = 'Uploading...';
                    const response = await fetch('/upload', {
                        method: 'POST',
                        body: formData
                    });
                    
                    const result = await response.json();
                    resultDiv.textContent = JSON.stringify(result, null, 2);
                    
                    if (result.files) {
                        resultDiv.textContent += '\\n\\nDownload links:\\n';
                        result.files.forEach(file => {
                            resultDiv.textContent += \`\\nhttp://localhost:3000/file/\${file.filename}\`;
                        });
                    }
                } catch (error) {
                    resultDiv.textContent = 'Error: ' + error.message;
                }
            });
        </script>
    </body>
    </html>
    `);
});

// Alternative route in case /test has issues
app.get('/uploader', (req, res) => {
    console.log('UPLOADER route accessed!');
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>PDF Uploader</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }
            .form-container {
                border: 1px solid #ccc;
                padding: 20px;
                border-radius: 5px;
            }
            .result {
                margin-top: 20px;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 5px;
                white-space: pre-wrap;
            }
        </style>
    </head>
    <body>
        <h1>PDF Uploader</h1>
        <div class="form-container">
            <form id="uploadForm">
                <input type="file" id="pdfFile" accept=".pdf" required>
                <button type="submit">Upload and Split</button>
            </form>
        </div>
        <div id="result" class="result"></div>

        <script>
            document.getElementById('uploadForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const resultDiv = document.getElementById('result');
                const fileInput = document.getElementById('pdfFile');
                
                if (!fileInput.files.length) {
                    resultDiv.textContent = 'Please select a file';
                    return;
                }

                const formData = new FormData();
                formData.append('file', fileInput.files[0]);

                try {
                    resultDiv.textContent = 'Uploading...';
                    const response = await fetch('/upload', {
                        method: 'POST',
                        body: formData
                    });
                    
                    const result = await response.json();
                    resultDiv.textContent = JSON.stringify(result, null, 2);
                    
                    if (result.files) {
                        resultDiv.textContent += '\\n\\nDownload links:\\n';
                        result.files.forEach(file => {
                            resultDiv.textContent += \`\\nhttp://localhost:3000/file/\${file.filename}\`;
                        });
                    }
                } catch (error) {
                    resultDiv.textContent = 'Error: ' + error.message;
                }
            });
        </script>
    </body>
    </html>
    `);
});

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
app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const { originalname, mimetype, path: tempPath } = req.file;
  console.log('Received file:', { originalname, mimetype, tempPath });
  
  try {
    // Check if this is a question file (you can adjust this condition)
    const isQuestionFile = originalname.toLowerCase().includes('hw') || 
                          originalname.toLowerCase().includes('question');
    
    console.log('Is question file:', isQuestionFile);
    
    if (isQuestionFile) {
      // Read the file
      console.log('Reading file from:', tempPath);
      let fileBuffer;
      try {
        fileBuffer = await fs.promises.readFile(tempPath);
        console.log('File read successfully, size:', fileBuffer.length);
        
        // Verify it's a PDF by checking the first few bytes
        const pdfHeader = fileBuffer.slice(0, 5).toString();
        if (!pdfHeader.startsWith('%PDF-')) {
          throw new Error('Invalid PDF file: Missing PDF header');
        }
      } catch (readError) {
        console.error('Error reading file:', readError);
        throw new Error('Failed to read file: ' + readError.message);
      }
      
      // Split the PDF into individual questions
      console.log('Splitting PDF into questions...');
      const questionPDFs = await splitPDFIntoQuestions(fileBuffer, originalname);
      console.log('PDF split successfully into', questionPDFs.length, 'questions');
      
      // Save the split PDFs temporarily
      console.log('Saving split PDFs temporarily...');
      const tempFiles = await saveSplitPDFs(questionPDFs);
      console.log('Temporary files saved:', tempFiles);
      
      // Upload each question to GridFS
      const uploadedFiles = [];
      for (let i = 0; i < questionPDFs.length; i++) {
        const question = questionPDFs[i];
        console.log(`Uploading question ${i + 1}/${questionPDFs.length}: ${question.filename}`);
        
        const uploadStream = gfsBucket.openUploadStream(question.filename, {
          contentType: mimetype,
          metadata: { 
            uploadedAt: new Date(),
            originalFile: originalname,
            questionNumber: i + 1
          }
        });
        
        await new Promise((resolve, reject) => {
          const readStream = fs.createReadStream(tempFiles[i]);
          readStream
            .pipe(uploadStream)
            .on('error', (err) => {
              console.error('Error uploading to GridFS:', err);
              reject(err);
            })
            .on('finish', () => {
              console.log(`Successfully uploaded ${question.filename}`);
              uploadedFiles.push({
                fileId: uploadStream.id,
                filename: question.filename
              });
              resolve();
            });
        });
        
        // Clean up temporary file
        try {
          await fs.promises.unlink(tempFiles[i]);
          console.log(`Cleaned up temporary file: ${tempFiles[i]}`);
        } catch (unlinkError) {
          console.error(`Error cleaning up temporary file ${tempFiles[i]}:`, unlinkError);
        }
      }
      
      // Clean up original temporary file
      try {
        await fs.promises.unlink(tempPath);
        console.log('Cleaned up original temporary file');
      } catch (unlinkError) {
        console.error('Error cleaning up original temporary file:', unlinkError);
      }
      
      res.json({ 
        message: 'Questions split and uploaded successfully',
        files: uploadedFiles
      });
    } else {
      // Handle regular file upload (existing code)
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
    }
  } catch (error) {
    console.error('Error processing file:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Error processing file',
      details: error.message
    });
  }
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
const PORT = 3001; // Force port 3001 without checking process.env.PORT
app.listen(PORT, () => console.log(`🚀 Listening on http://localhost:${PORT}`));