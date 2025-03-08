const express = require('express');
const path = require('path');
const app = express();
const port = 3002;

// Serve static files from the current directory
app.use(express.static(__dirname));

// Route for the home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-api.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Test server running at http://localhost:${port}`);
  console.log(`Open http://localhost:${port} in your browser to test the API`);
}); 