#!/usr/bin/env node

/**
 * Migration Script: From deploy-bypass.js to TypeScript
 * 
 * This script will help you identify and migrate functions from the deploy-bypass.js
 * file to their appropriate TypeScript files in the src directory.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Define paths
const BYPASS_FILE_PATH = path.join(__dirname, '..', 'deploy-bypass.js');
const SRC_DIR = path.join(__dirname, '..', 'src');
const UTILS_DIR = path.join(SRC_DIR, 'utils');
const HELPERS_DIR = path.join(SRC_DIR, 'helpers');

// Ensure directories exist
if (!fs.existsSync(UTILS_DIR)) {
  fs.mkdirSync(UTILS_DIR, { recursive: true });
}

if (!fs.existsSync(HELPERS_DIR)) {
  fs.mkdirSync(HELPERS_DIR, { recursive: true });
}

// Create a readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Read the bypass file
try {
  const bypassContent = fs.readFileSync(BYPASS_FILE_PATH, 'utf8');
  
  // Extract functions using regex
  const functionRegex = /function\s+([a-zA-Z0-9_]+)\s*\([^)]*\)\s*{[\s\S]*?(?=function|\n\n|$)/g;
  let match;
  const functions = [];
  
  while ((match = functionRegex.exec(bypassContent)) !== null) {
    functions.push({
      name: match[1],
      code: match[0]
    });
  }
  
  console.log(`Found ${functions.length} functions in deploy-bypass.js:`);
  functions.forEach((fn, index) => {
    console.log(`${index + 1}. ${fn.name}`);
  });
  
  console.log('\nLet\'s migrate these functions to TypeScript files.');
  
  // Helper function to process each function
  const processFunction = (index) => {
    if (index >= functions.length) {
      console.log('\nMigration complete!');
      rl.close();
      return;
    }
    
    const fn = functions[index];
    console.log(`\nProcessing function: ${fn.name}`);
    
    rl.question('Which category does this function belong to? (utils/helpers/controllers/models/skip): ', (category) => {
      if (category.toLowerCase() === 'skip') {
        console.log(`Skipping ${fn.name}`);
        processFunction(index + 1);
        return;
      }
      
      let destDir;
      switch (category.toLowerCase()) {
        case 'utils':
          destDir = UTILS_DIR;
          break;
        case 'helpers':
          destDir = HELPERS_DIR;
          break;
        case 'controllers':
          destDir = path.join(SRC_DIR, 'controllers');
          break;
        case 'models':
          destDir = path.join(SRC_DIR, 'models');
          break;
        default:
          console.log('Invalid category. Using utils as default.');
          destDir = UTILS_DIR;
      }
      
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      
      // Convert function to TypeScript
      const tsCode = convertToTypeScript(fn.code);
      
      // Write to TypeScript file
      const fileName = `${fn.name}.ts`;
      const filePath = path.join(destDir, fileName);
      
      fs.writeFileSync(filePath, tsCode);
      console.log(`Function ${fn.name} migrated to ${filePath}`);
      
      processFunction(index + 1);
    });
  };
  
  // Convert JavaScript function to TypeScript
  const convertToTypeScript = (jsCode) => {
    // Basic conversion - in a real scenario, you would want more sophisticated type inference
    let tsCode = jsCode
      // Add return type (needs manual adjustment)
      .replace(/function\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/, 'function $1($2): any')
      // Add parameter types (needs manual adjustment)
      .replace(/\(([^)]*)\)/, (match, params) => {
        if (!params.trim()) return '()';
        
        const typedParams = params.split(',').map(param => {
          param = param.trim();
          return `${param}: any`;
        }).join(', ');
        
        return `(${typedParams})`;
      });
      
    // Add export
    tsCode = `/**
 * @description Function migrated from deploy-bypass.js
 * TODO: Add proper TypeScript types
 */
export ${tsCode}`;
    
    return tsCode;
  };
  
  // Start processing functions
  processFunction(0);
  
} catch (error) {
  console.error('Error reading the bypass file:', error);
  rl.close();
} 