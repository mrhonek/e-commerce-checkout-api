/**
 * Fallback Deployment Script
 * 
 * This script is designed to be used when Docker builds fail on Railway.
 * It directly uses the deploy-bypass.js script without requiring TypeScript compilation.
 */

// Copy the deploy-bypass.js file to the correct location
const fs = require('fs');
const path = require('path');

// Ensure the dist directory exists
if (!fs.existsSync('./dist')) {
  fs.mkdirSync('./dist', { recursive: true });
}

// Create a simple server.js file that just requires the bypass script
const serverContent = `
// This is a fallback server file created by the deploy-fallback script
// It simply requires the deploy-bypass.js file in the root directory
require('../deploy-bypass.js');
`;

// Write the server file to the dist directory
fs.writeFileSync('./dist/server.js', serverContent);

console.log('Created fallback server.js file in dist directory');
console.log('The application will run using the deploy-bypass.js script');

// Exit with success
process.exit(0); 