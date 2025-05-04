// Minimal Express server to test routing
const express = require('express');
const app = express();

// Basic routes
app.get('/', (req, res) => {
  console.log('Root route accessed');
  res.send('Hello from test server!');
});

app.get('/test', (req, res) => {
  console.log('Test route accessed');
  res.send('<h1>Test route works!</h1>');
});

// Start server on a different port
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
}); 