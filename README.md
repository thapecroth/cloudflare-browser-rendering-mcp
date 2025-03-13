# Cloudflare Browser Rendering MCP Server

[![smithery badge](https://smithery.ai/badge/@amotivv/cloudflare-browser-rendering-mcp)](https://smithery.ai/server/@amotivv/cloudflare-browser-rendering-mcp)

This MCP (Model Context Protocol) server provides tools for fetching and processing web content using Cloudflare Browser Rendering for use as context in LLMs. It's designed to work with both Claude and Cline client environments.

<a href="https://glama.ai/mcp/servers/35u5mo3dm5">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/35u5mo3dm5/badge" alt="cloudflare-browser-rendering-mcp MCP server" />
</a>

## Features

- **Web Content Fetching**: Fetch and process web pages for LLM context
- **Documentation Search**: Search Cloudflare documentation and return relevant content
- **Structured Content Extraction**: Extract structured content from web pages using CSS selectors
- **Content Summarization**: Summarize web content for more concise LLM context
- **Screenshot Capture**: Take screenshots of web pages

## Prerequisites

- Node.js v18 or higher
- A Cloudflare account with Browser Rendering API access
- A deployed Cloudflare Worker using the provided `puppeteer-worker.js` file

## Installation

### Installing via Smithery

To install Cloudflare Browser Rendering for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@amotivv/cloudflare-browser-rendering-mcp):

```bash
npx -y @smithery/cli install @amotivv/cloudflare-browser-rendering-mcp --client claude
```

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/cloudflare-browser-rendering.git
   cd cloudflare-browser-rendering
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

## Cloudflare Worker Setup

1. Deploy the `puppeteer-worker.js` file to Cloudflare Workers using Wrangler:
   ```bash
   npx wrangler deploy
   ```

2. Make sure to configure the following bindings in your Cloudflare Worker:
   - Browser Rendering binding named `browser`
   - KV namespace binding named `SCREENSHOTS`

3. Note the URL of your deployed worker (e.g., `https://browser-rendering-api.yourusername.workers.dev`)

## Configuration

### For Claude Desktop

1. Open the Claude Desktop configuration file:
   ```bash
   # macOS
   code ~/Library/Application\ Support/Claude/claude_desktop_config.json
   
   # Windows
   code %APPDATA%\Claude\claude_desktop_config.json
   ```

2. Add the MCP server configuration:
   ```json
   {
     "mcpServers": {
       "cloudflare-browser-rendering": {
         "command": "node",
         "args": ["/path/to/cloudflare-browser-rendering/dist/index.js"],
         "env": {
           "BROWSER_RENDERING_API": "https://your-worker-url.workers.dev"
         },
         "disabled": false,
         "autoApprove": []
       }
     }
   }
   ```

3. Restart Claude Desktop

### For Cline

1. Open the Cline MCP settings file:
   ```bash
   # macOS
   code ~/Library/Application\ Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json
   
   # Windows
   code %APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json
   ```

2. Add the MCP server configuration:
   ```json
   {
     "mcpServers": {
       "cloudflare-browser-rendering": {
         "command": "node",
         "args": ["/path/to/cloudflare-browser-rendering/dist/index.js"],
         "env": {
           "BROWSER_RENDERING_API": "https://your-worker-url.workers.dev"
         },
         "disabled": false,
         "autoApprove": []
       }
     }
   }
   ```

## Usage

Once configured, the MCP server will be available to both Claude Desktop and Cline. You can use the following tools:

### fetch_page

Fetches and processes a web page for LLM context.

**Parameters:**
- `url` (required): URL to fetch
- `maxContentLength` (optional): Maximum content length to return

**Example:**
```
Can you fetch and summarize the content from https://developers.cloudflare.com/browser-rendering/?
```

### search_documentation

Searches Cloudflare documentation and returns relevant content.

**Parameters:**
- `query` (required): Search query
- `maxResults` (optional): Maximum number of results to return

**Example:**
```
Search the Cloudflare documentation for information about "browser rendering API".
```

### extract_structured_content

Extracts structured content from a web page using CSS selectors.

**Parameters:**
- `url` (required): URL to extract content from
- `selectors` (required): CSS selectors to extract content

**Example:**
```
Extract the main heading and first paragraph from https://developers.cloudflare.com/browser-rendering/ using the selectors h1 and p.
```

### summarize_content

Summarizes web content for more concise LLM context.

**Parameters:**
- `url` (required): URL to summarize
- `maxLength` (optional): Maximum length of the summary

**Example:**
```
Summarize the content from https://developers.cloudflare.com/browser-rendering/ in 300 words or less.
```

### take_screenshot

Takes a screenshot of a web page.

**Parameters:**
- `url` (required): URL to take a screenshot of
- `width` (optional): Width of the viewport in pixels (default: 1280)
- `height` (optional): Height of the viewport in pixels (default: 800)
- `fullPage` (optional): Whether to take a screenshot of the full page or just the viewport (default: false)

**Example:**
```
Take a screenshot of https://developers.cloudflare.com/browser-rendering/ with a width of 1024 pixels.
```

## Troubleshooting

### Logging

The MCP server uses comprehensive logging with the following prefixes:

- `[Setup]`: Initialization and configuration
- `[API]`: API requests and responses
- `[Error]`: Error handling and debugging

To view logs:

- **Claude Desktop**: Check the logs in `~/Library/Logs/Claude/mcp*.log` (macOS) or `%APPDATA%\Claude\Logs\mcp*.log` (Windows)
- **Cline**: Logs appear in the output console of the VSCode extension

### Common Issues

1. **"BROWSER_RENDERING_API environment variable is not set"**
   - Make sure you've set the correct URL to your Cloudflare Worker in the MCP server configuration

2. **"Cloudflare worker API is unavailable or not configured"**
   - Verify that your Cloudflare Worker is deployed and running
   - Check that the URL is correct and accessible

3. **"Browser binding is not available"**
   - Ensure that you've configured the Browser Rendering binding in your Cloudflare Worker

4. **"SCREENSHOTS KV binding is not available"**
   - Ensure that you've configured the KV namespace binding in your Cloudflare Worker

## Development

### Project Structure

- `src/index.ts`: Main entry point
- `src/server.ts`: MCP server implementation
- `src/browser-client.ts`: Client for interacting with Cloudflare Browser Rendering
- `src/content-processor.ts`: Processes web content for LLM context
- `puppeteer-worker.js`: Cloudflare Worker implementation

### Building

```bash
npm run build
```

### Testing

The project includes a comprehensive test script that verifies all MCP tools are working correctly:

```bash
npm test
```

This will:
1. Start the MCP server
2. Test each tool with sample requests
3. Verify the responses
4. Provide a summary of test results

You can also run individual tests for specific components:

```bash
# Test the Puppeteer integration
npm run test:puppeteer
```

For the tests to work properly, make sure you have:
1. Built the project with `npm run build`
2. Set the `BROWSER_RENDERING_API` environment variable to your Cloudflare Worker URL
3. Deployed the Cloudflare Worker with the necessary bindings

## License

MIT