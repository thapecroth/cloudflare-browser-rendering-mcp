#!/usr/bin/env node
import { spawn } from 'child_process';
import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Test script for the Cloudflare Browser Rendering MCP server
 * 
 * This script tests the MCP server by sending test requests for each tool
 * and verifying the responses.
 */

// Configuration
const SERVER_PATH = path.join(__dirname, 'dist', 'index.js');
const TEST_URL = 'https://developers.cloudflare.com/browser-rendering/';
const TEST_QUERY = 'browser rendering api';
const TEST_SELECTORS = {
  heading: 'h1',
  description: '.DocSearch-content p:first-of-type'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

/**
 * Log a message with a prefix and color
 */
function log(prefix, message, color = colors.reset) {
  console.log(`${color}[${prefix}]${colors.reset} ${message}`);
}

/**
 * Log a success message
 */
function success(message) {
  log('SUCCESS', message, colors.green);
}

/**
 * Log an error message
 */
function error(message) {
  log('ERROR', message, colors.red);
}

/**
 * Log an info message
 */
function info(message) {
  log('INFO', message, colors.blue);
}

/**
 * Log a warning message
 */
function warn(message) {
  log('WARNING', message, colors.yellow);
}

/**
 * Check if the server path exists
 */
function checkServerPath() {
  if (!fs.existsSync(SERVER_PATH)) {
    error(`Server not found at ${SERVER_PATH}`);
    error('Make sure you have built the project with "npm run build"');
    process.exit(1);
  }
  success(`Server found at ${SERVER_PATH}`);
}

/**
 * Start the MCP server process
 */
function startServer() {
  info('Starting MCP server...');
  
  // Set the BROWSER_RENDERING_API environment variable if not already set
  if (!process.env.BROWSER_RENDERING_API) {
    warn('BROWSER_RENDERING_API environment variable not set');
    warn('Some tests may fail if the Cloudflare Worker is not configured');
  } else {
    info(`Using Cloudflare Worker at: ${process.env.BROWSER_RENDERING_API}`);
  }
  
  // Start the server process
  const serverProcess = spawn('node', [SERVER_PATH], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  // Handle server process events
  serverProcess.on('error', (err) => {
    error(`Failed to start server: ${err.message}`);
    process.exit(1);
  });
  
  // Show all server output for better debugging
  serverProcess.stderr.on('data', (data) => {
    const logLines = data.toString().trim().split('\n');
    for (const logLine of logLines) {
      if (logLine.trim()) {
        if (logLine.includes('[Error]')) {
          console.error(`${colors.red}[Server] ${logLine}${colors.reset}`);
        } else if (logLine.includes('[Warning]') || logLine.includes('[Warn]')) {
          console.error(`${colors.yellow}[Server] ${logLine}${colors.reset}`);
        } else if (logLine.includes('[Setup]')) {
          console.error(`${colors.cyan}[Server] ${logLine}${colors.reset}`);
        } else if (logLine.includes('[API]')) {
          console.error(`${colors.blue}[Server] ${logLine}${colors.reset}`);
        } else {
          console.error(`${colors.dim}[Server] ${logLine}${colors.reset}`);
        }
      }
    }
  });
  
  // Create readline interface for stdin/stdout
  const rl = readline.createInterface({
    input: serverProcess.stdout,
    output: serverProcess.stdin,
    terminal: false
  });
  
  success('MCP server started');
  return { serverProcess, rl };
}

/**
 * Send a request to the MCP server
 */
async function sendRequest(rl, request) {
  return new Promise((resolve) => {
    // Debug the request
    info(`Sending request: ${request.method} (ID: ${request.id})`);
    
    // Listen for the response
    const responseHandler = (line) => {
      try {
        // Try to parse the response as JSON
        const response = JSON.parse(line);
        
        // Check if this is a response to our request
        if (response.id === request.id) {
          // Debug the response
          if (response.error) {
            error(`Received error response: ${JSON.stringify(response.error)}`);
          } else {
            info(`Received successful response for ID: ${response.id}`);
          }
          
          rl.removeListener('line', responseHandler);
          resolve(response);
        }
      } catch (err) {
        // Log non-JSON lines for debugging
        if (line.trim()) {
          warn(`Received non-JSON line: ${line.substring(0, 100)}${line.length > 100 ? '...' : ''}`);
        }
      }
    };
    
    rl.on('line', responseHandler);
    
    // Send the request with proper JSON-RPC 2.0 format
    rl.output.write(JSON.stringify(request) + '\n');
  });
}

/**
 * Test the fetch_page tool
 */
async function testFetchPage(rl) {
  info('Testing fetch_page tool...');
  
  const request = {
    jsonrpc: "2.0",
    id: 'test-fetch-page',
    method: 'tools/call',
    params: {
      name: 'fetch_page',
      arguments: {
        url: TEST_URL,
        maxContentLength: 1000
      }
    }
  };
  
  try {
    const response = await sendRequest(rl, request);
    
    // Check for JSON-RPC 2.0 response format
    if (response.jsonrpc === "2.0" && response.result && response.result.content && response.result.content[0].text) {
      success('fetch_page tool test passed');
      return true;
    } else {
      error('fetch_page tool test failed: Invalid response format');
      console.error(JSON.stringify(response, null, 2));
      return false;
    }
  } catch (err) {
    error(`fetch_page tool test failed: ${err.message}`);
    return false;
  }
}

/**
 * Test the search_documentation tool
 */
async function testSearchDocumentation(rl) {
  info('Testing search_documentation tool...');
  
  const request = {
    jsonrpc: "2.0",
    id: 'test-search-documentation',
    method: 'tools/call',
    params: {
      name: 'search_documentation',
      arguments: {
        query: TEST_QUERY,
        maxResults: 2
      }
    }
  };
  
  try {
    const response = await sendRequest(rl, request);
    
    // Check for JSON-RPC 2.0 response format
    if (response.jsonrpc === "2.0" && response.result && response.result.content && response.result.content[0].text) {
      success('search_documentation tool test passed');
      return true;
    } else {
      error('search_documentation tool test failed: Invalid response format');
      console.error(JSON.stringify(response, null, 2));
      return false;
    }
  } catch (err) {
    error(`search_documentation tool test failed: ${err.message}`);
    return false;
  }
}

/**
 * Test the extract_structured_content tool
 */
async function testExtractStructuredContent(rl) {
  info('Testing extract_structured_content tool...');
  
  const request = {
    jsonrpc: "2.0",
    id: 'test-extract-structured-content',
    method: 'tools/call',
    params: {
      name: 'extract_structured_content',
      arguments: {
        url: TEST_URL,
        selectors: TEST_SELECTORS
      }
    }
  };
  
  try {
    const response = await sendRequest(rl, request);
    
    // Check for JSON-RPC 2.0 response format
    if (response.jsonrpc === "2.0" && response.result && response.result.content && response.result.content[0].text) {
      success('extract_structured_content tool test passed');
      return true;
    } else {
      error('extract_structured_content tool test failed: Invalid response format');
      console.error(JSON.stringify(response, null, 2));
      return false;
    }
  } catch (err) {
    error(`extract_structured_content tool test failed: ${err.message}`);
    return false;
  }
}

/**
 * Test the summarize_content tool
 */
async function testSummarizeContent(rl) {
  info('Testing summarize_content tool...');
  
  const request = {
    jsonrpc: "2.0",
    id: 'test-summarize-content',
    method: 'tools/call',
    params: {
      name: 'summarize_content',
      arguments: {
        url: TEST_URL,
        maxLength: 300
      }
    }
  };
  
  try {
    const response = await sendRequest(rl, request);
    
    // Check for JSON-RPC 2.0 response format
    if (response.jsonrpc === "2.0" && response.result && response.result.content && response.result.content[0].text) {
      success('summarize_content tool test passed');
      return true;
    } else {
      error('summarize_content tool test failed: Invalid response format');
      console.error(JSON.stringify(response, null, 2));
      return false;
    }
  } catch (err) {
    error(`summarize_content tool test failed: ${err.message}`);
    return false;
  }
}

/**
 * Test the take_screenshot tool
 */
async function testTakeScreenshot(rl) {
  info('Testing take_screenshot tool...');
  
  const request = {
    jsonrpc: "2.0",
    id: 'test-take-screenshot',
    method: 'tools/call',
    params: {
      name: 'take_screenshot',
      arguments: {
        url: TEST_URL,
        width: 1024,
        height: 768,
        fullPage: false
      }
    }
  };
  
  try {
    const response = await sendRequest(rl, request);
    
    // Check for JSON-RPC 2.0 response format
    if (response.jsonrpc === "2.0" && response.result && response.result.content && response.result.content[0].text) {
      success('take_screenshot tool test passed');
      return true;
    } else {
      error('take_screenshot tool test failed: Invalid response format');
      console.error(JSON.stringify(response, null, 2));
      return false;
    }
  } catch (err) {
    error(`take_screenshot tool test failed: ${err.message}`);
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  // Check if the server path exists
  checkServerPath();
  
  // Start the server
  const { serverProcess, rl } = startServer();
  
  // Wait for the server to initialize
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Run the tests
  const results = {
    fetchPage: await testFetchPage(rl),
    searchDocumentation: await testSearchDocumentation(rl),
    extractStructuredContent: await testExtractStructuredContent(rl),
    summarizeContent: await testSummarizeContent(rl),
    takeScreenshot: await testTakeScreenshot(rl)
  };
  
  // Print the test results
  console.log('\n');
  log('TEST RESULTS', '='.repeat(50), colors.bright);
  
  for (const [test, passed] of Object.entries(results)) {
    const status = passed ? `${colors.green}PASSED${colors.reset}` : `${colors.red}FAILED${colors.reset}`;
    console.log(`${test}: ${status}`);
  }
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  
  console.log('\n');
  log('SUMMARY', `${passedTests}/${totalTests} tests passed`, 
    passedTests === totalTests ? colors.green : colors.yellow);
  
  // Terminate the server process
  serverProcess.kill();
  process.exit(passedTests === totalTests ? 0 : 1);
}

// Run the tests
runTests().catch(err => {
  error(`Test runner error: ${err.message}`);
  process.exit(1);
});
