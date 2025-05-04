// Alternative server with different configuration
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const { splitPDFIntoQuestions, saveSplitPDFs } = require('./pdfSplitter');

const app = express();
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Use uploads folder for file storage
const upload = multer({ dest: 'uploads/' });

// Basic route
app.get('/', (req, res) => {
  console.log('Root route accessed');
  res.send('Alternative server is running!');
});

// Test page
app.get('/test', (req, res) => {
  console.log('Test route accessed');
  res.send(`
  <!DOCTYPE html>
  <html>
  <head>
      <title>Alternative PDF Splitter</title>
      <style>
          body { font-family: Arial; padding: 20px; }
          .form { border: 1px solid #ccc; padding: 20px; }
          .result { margin-top: 20px; padding: 10px; border: 1px solid #ddd; }
      </style>
  </head>
  <body>
      <h1>Alternative PDF Splitter</h1>
      <div class="form">
          <form id="uploadForm">
              <input type="file" id="pdfFile" accept=".pdf" required>
              <button type="submit">Upload PDF</button>
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
                  const response = await fetch('/alt-upload', {
                      method: 'POST',
                      body: formData
                  });
                  
                  const result = await response.json();
                  resultDiv.textContent = JSON.stringify(result, null, 2);
              } catch (error) {
                  resultDiv.textContent = 'Error: ' + error.message;
              }
          });
      </script>
  </body>
  </html>
  `);
});

// Upload endpoint
app.post('/alt-upload', upload.single('file'), (req, res) => {
  console.log('Upload endpoint accessed');
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const { originalname, mimetype, path: tempPath } = req.file;
  console.log('File received:', originalname);
  
  // Just return success for now
  res.json({
    success: true,
    message: 'File received successfully',
    file: {
      name: originalname,
      type: mimetype,
      size: fs.statSync(tempPath).size
    }
  });
  
  // Clean up temporary file
  fs.unlink(tempPath, (err) => {
    if (err) console.error('Error deleting temp file:', err);
  });
});

// Start server on a different port
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Alternative server running on http://localhost:${PORT}`);
}); 