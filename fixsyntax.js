// This script will fix the syntax errors in server.js
const fs = require('fs');
const path = require('path');

// Read the current server.js file
const serverPath = path.join(__dirname, 'server.js');
let content = fs.readFileSync(serverPath, 'utf8');

// Fix the syntax errors in the console.log statements
content = content.replace(
  /console\.log\('Request body:', JSON\.stringify\(req\.body, null, 2\)\.substring\(0, 500\) \+ '\.\.\.';/g,
  "console.log('Request body:', JSON.stringify(req.body, null, 2).substring(0, 500) + '...');"
);

// Save the fixed file
fs.writeFileSync(serverPath, content, 'utf8');
console.log('Fixed syntax errors in server.js');

// Now find the catch-all route and the Stripe test endpoint
const catchAllMatch = content.match(/\/\/ Generic catch-all endpoint for debugging\s*app\.all\('\/api\/\*'/);
const stripeTestMatch = content.match(/\/\/ Add a Stripe test endpoint to trigger a test event\s*app\.get\('\/api\/stripe\/test'/);

if (catchAllMatch && stripeTestMatch) {
  // Check if the test endpoint comes after the catch-all route
  if (content.indexOf(catchAllMatch[0]) < content.indexOf(stripeTestMatch[0])) {
    console.log('Need to move Stripe test endpoint before catch-all route');
    
    // Extract the entire Stripe test endpoint function
    const stripeTestRegex = /\/\/ Add a Stripe test endpoint to trigger a test event\s*app\.get\('\/api\/stripe\/test'[\s\S]*?}\);/;
    const stripeTestFunc = content.match(stripeTestRegex)[0];
    
    // Remove it from its original location
    content = content.replace(stripeTestRegex, '');
    
    // Insert it before the catch-all route
    content = content.replace(
      /\/\/ Generic catch-all endpoint for debugging/,
      stripeTestFunc + '\n\n// Generic catch-all endpoint for debugging'
    );
    
    // Save the updated file
    fs.writeFileSync(serverPath, content, 'utf8');
    console.log('Moved Stripe test endpoint before catch-all route');
  } else {
    console.log('Stripe test endpoint is already before catch-all route');
  }
} else {
  console.log('Could not find catch-all route or Stripe test endpoint');
}

console.log('Done! Please check server.js for the changes.'); 