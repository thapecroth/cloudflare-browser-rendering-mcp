#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { BrowserRenderingServer } from './server.js';

/**
 * Main entry point for the Cloudflare Browser Rendering MCP server
 */
async function main() {
  try {
    console.error('[Setup] Starting Cloudflare Browser Rendering MCP server...');
    const server = new BrowserRenderingServer();
    await server.run();
    console.error('[Setup] Cloudflare Browser Rendering MCP server running on stdio');
  } catch (error) {
    console.error('[Error] Failed to start MCP server:', error);
    process.exit(1);
  }
}

// Run the server
main().catch(error => console.error('[Error] Unhandled exception:', error));
