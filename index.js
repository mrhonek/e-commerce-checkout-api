// Simple Express server for debugging Railway deployment issues
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({
    message: 'API is running',
    env: process.env.NODE_ENV,
    time: new Date().toISOString()
  });
});

app.listen(port, () => {
  console.log(`Fallback server running on port ${port}`);
}); 