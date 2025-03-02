import puppeteer from '@cloudflare/puppeteer';

/**
 * Cloudflare Worker with Browser Rendering binding
 * 
 * This worker demonstrates how to use the Browser Rendering binding
 * with the @cloudflare/puppeteer package.
 */

// Constants for the KV storage
const SCREENSHOT_EXPIRATION = 60 * 60; // 1 hour in seconds

/**
 * Generate a unique ID for screenshot storage
 */
function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Define the allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://example.com',
  'http://localhost:3000',
];

/**
 * Handle CORS preflight requests
 */
function handleOptions(request) {
  const origin = request.headers.get('Origin');
  const isAllowedOrigin = ALLOWED_ORIGINS.includes(origin);
  
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': isAllowedOrigin ? origin : ALLOWED_ORIGINS[0],
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * Add CORS headers to a response
 */
function addCorsHeaders(response, request) {
  const origin = request.headers.get('Origin');
  const isAllowedOrigin = ALLOWED_ORIGINS.includes(origin);
  
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', isAllowedOrigin ? origin : ALLOWED_ORIGINS[0]);
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Handle the /content endpoint
 */
async function handleContent(request, env) {
  try {
    // Parse the request body
    const body = await request.json();
    
    if (!body.url) {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Launch a browser using the binding
    const browser = await puppeteer.launch(env.browser);
    
    try {
      // Create a new page
      const page = await browser.newPage();
      
      // Set viewport size
      await page.setViewport({
        width: 1280,
        height: 800,
      });
      
      // Set request rejection patterns if provided
      if (body.rejectResourceTypes && Array.isArray(body.rejectResourceTypes)) {
        await page.setRequestInterception(true);
        page.on('request', (req) => {
          if (body.rejectResourceTypes.includes(req.resourceType())) {
            req.abort();
          } else {
            req.continue();
          }
        });
      }
      
      // Navigate to the URL
      await page.goto(body.url, {
        waitUntil: body.waitUntil || 'networkidle0',
        timeout: body.timeout || 30000,
      });
      
      // Get the page content
      const content = await page.content();
      
      // Return the content
      return new Response(JSON.stringify({ content }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } finally {
      // Always close the browser to avoid resource leaks
      await browser.close();
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message, stack: error.stack }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Handle the /image/{id} endpoint to serve cached screenshots
 */
async function handleImage(request, env) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    
    console.log(`Requested image with ID: ${id}`);
    
    // Get the image metadata and data from KV
    const metadata = await env.SCREENSHOTS.get(`${id}:meta`, { type: 'json' });
    
    if (!metadata) {
      console.error(`Image metadata not found in KV: ${id}`);
      return new Response('Image not found', { 
        status: 404,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
    
    // Get the actual image data
    const base64Data = await env.SCREENSHOTS.get(`${id}:data`, { type: 'text' });
    
    if (!base64Data) {
      console.error(`Image data not found in KV: ${id}`);
      return new Response('Image data not found', { 
        status: 404,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
    
    // Convert base64 to binary using Cloudflare Workers API
    const binaryData = atob(base64Data);
    const bytes = new Uint8Array(binaryData.length);
    for (let i = 0; i < binaryData.length; i++) {
      bytes[i] = binaryData.charCodeAt(i);
    }
    
    console.log(`Serving image ${id} with content type: ${metadata.contentType}`);
    
    return new Response(bytes, {
      headers: { 
        'Content-Type': metadata.contentType,
        'Cache-Control': 'public, max-age=3600' // Allow browser caching for 1 hour
      }
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return new Response(`Error serving image: ${error.message}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

/**
 * Handle the /screenshot endpoint
 */
async function handleScreenshot(request, env) {
  let browser = null;
  
  try {
    console.log('Starting screenshot process');
    
    // Parse the request body
    const body = await request.json();
    
    if (!body.url) {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Validate URL
    try {
      new URL(body.url);
    } catch (e) {
      return new Response(JSON.stringify({ error: `Invalid URL: ${body.url}` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    console.log(`Processing screenshot request for URL: ${body.url}`);
    
    // Check if we have a valid browser binding
    if (!env.browser) {
      return new Response(JSON.stringify({ error: 'Browser binding is not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Check if KV is available
    if (!env.SCREENSHOTS) {
      return new Response(JSON.stringify({ error: 'SCREENSHOTS KV binding is not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Launch a browser using the binding with timeout
    const browserLaunchTimeout = setTimeout(() => {
      if (!browser) {
        throw new Error('Browser launch timed out');
      }
    }, 15000); // 15-second timeout for browser launch
    
    browser = await puppeteer.launch(env.browser);
    clearTimeout(browserLaunchTimeout);
    
    console.log('Browser launched successfully');
    
    try {
      // Create a new page
      const page = await browser.newPage();
      
      // Set smaller viewport size to reduce memory usage
      const width = Math.min(body.width || 1280, 1600);
      const height = Math.min(body.height || 800, 1200);
      
      await page.setViewport({
        width,
        height,
      });
      
      // Set navigation timeout
      const timeout = Math.min(body.timeout || 30000, 60000); // Cap at 60 seconds
      
      // Abort requests to unnecessary resources to improve performance
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const resourceType = req.resourceType();
        if (['image', 'font', 'media'].includes(resourceType) && !body.includeResources) {
          req.abort();
        } else {
          req.continue();
        }
      });
      
      // Navigate to the URL with timeout
      console.log(`Navigating to ${body.url}`);
      await page.goto(body.url, {
        waitUntil: body.waitUntil || 'networkidle2', // Using networkidle2 instead of networkidle0 for better reliability
        timeout,
      });
      
      console.log('Navigation completed, taking screenshot');
      
      // Cap fullPage option to reduce memory usage
      const fullPage = body.fullPage === true && !body.forceFullPage ? false : body.fullPage || false;
      
      // Take a screenshot with reduced quality to save memory
      const screenshot = await page.screenshot({
        fullPage,
        type: 'jpeg', // Use JPEG instead of PNG for smaller file size
        quality: 80,   // Reduce quality to save memory
        encoding: 'base64',
      });
      
      console.log('Screenshot taken successfully');
      
      // Generate a unique ID for this screenshot
      const id = generateUniqueId();
      const contentType = 'image/jpeg';
      
      // Create metadata for the screenshot
      const metadata = {
        contentType,
        width,
        height,
        fullPage,
        format: 'jpeg',
        timestamp: Date.now(),
        originalUrl: body.url
      };
      
      // Store both metadata and image data in KV with expiration
      const expirationTtl = SCREENSHOT_EXPIRATION; // 1 hour in seconds
      
      // Store metadata and image data in KV
      await Promise.all([
        env.SCREENSHOTS.put(`${id}:meta`, JSON.stringify(metadata), { expirationTtl }),
        env.SCREENSHOTS.put(`${id}:data`, screenshot, { expirationTtl })
      ]);
      
      console.log(`Screenshot saved to KV with ID: ${id}`);
      
      // Generate URL (using the request URL to get the origin)
      const origin = new URL(request.url).origin;
      const imageUrl = `${origin}/image/${id}`;
      
      console.log(`Screenshot processed successfully, assigned ID: ${id}`);
      
      // Return only the URL (no base64 data) and include metadata
      return new Response(JSON.stringify({ 
        url: imageUrl,
        width,
        height,
        format: 'jpeg',
        fullPage,
        expiresIn: `${expirationTtl} seconds`,
        id
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } finally {
      // Always close the browser to avoid resource leaks
      if (browser) {
        console.log('Closing browser');
        await browser.close();
        browser = null;
      }
    }
  } catch (error) {
    console.error('Error in screenshot process:', error);
    
    // Ensure browser is closed even on error
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
    
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.stack,
      type: 'screenshot_error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// KV values expire automatically based on the expirationTtl so no explicit cleanup is needed

/**
 * Main worker handler
 */
export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }
    
    // Get the URL pathname
    const url = new URL(request.url);
    const path = url.pathname.toLowerCase();
    
    // Route the request to the appropriate handler
    let response;
    if (path.endsWith('/content')) {
      response = await handleContent(request, env);
    } else if (path.endsWith('/screenshot')) {
      response = await handleScreenshot(request, env);
    } else if (path.match(/\/image\/[a-z0-9]+$/)) {
      response = await handleImage(request, env);
    } else {
      response = new Response(JSON.stringify({ 
        error: 'Not found',
        endpoints: ['/content', '/screenshot', '/image/{id}']
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // No cleanup needed as KV handles expiration automatically
    
    // Add CORS headers to the response
    return addCorsHeaders(response, request);
  },
  
  // Scheduled handler
  async scheduled(event, env, ctx) {
    // No cleanup needed as KV handles expiration automatically
  }
};
