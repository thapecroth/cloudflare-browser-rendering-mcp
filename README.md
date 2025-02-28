<h1 align="center">Cloudflare Browser Rendering MCP Server</h1>

<p align="center">
  Cline MCP integration for Cloudflare Browser Rendering - fetch, process, and analyze web content for LLMs
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
</p>

This MCP server provides tools for interacting with Cloudflare Browser Rendering, allowing you to fetch and process web content for use as context in LLMs directly from Cline.

## Features

- **Fetch Web Pages**: Retrieve and process content from any URL, handling JavaScript rendering
- **Search Documentation**: Find relevant information in Cloudflare documentation
- **Extract Structured Content**: Pull specific content from web pages using CSS selectors
- **Summarize Content**: Get concise summaries of web pages for more efficient context

## Installation

The server should be installed and configured for use with Cline. To complete the setup:

1. Edit the Cline MCP settings file at:
   ```
   ~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json
   ```

2. Add the Cloudflare Browser Rendering API endpoint:
   ```json
   "cloudflare-browser-rendering": {
     "command": "node",
     "args": [
       "<path-to-repository>/dist/index.js"
     ],
     "env": {
       "BROWSER_RENDERING_API": "https://your-browser-rendering-api.workers.dev"
     },
     "disabled": false,
     "autoApprove": []
   }
   ```

## Setting Up Your Cloudflare Worker

This MCP server requires a Cloudflare Worker with Browser Rendering capabilities to function. Follow these steps to set up your own worker:

### Prerequisites

1. A Cloudflare account (sign up at [cloudflare.com](https://cloudflare.com))
2. The [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed and authenticated
3. Access to the Browser Rendering API (may require a paid Workers plan)

### Worker Setup

1. **Create a new Worker in Cloudflare**:
   - Go to the Cloudflare dashboard
   - Navigate to Workers & Pages
   - Click "Create application" and select "Create Worker"
   - Give your worker a name (e.g., "browser-rendering-api")

2. **Configure Wrangler**:
   - This repository includes a `wrangler.toml` file and `puppeteer-worker.js` that are ready to use
   - Update the `name` in `wrangler.toml` if you chose a different worker name
   - Optionally, update the `ALLOWED_ORIGINS` in `puppeteer-worker.js` to include your domains

3. **Enable Browser Rendering**:
   - In the Cloudflare dashboard, go to your worker
   - Click on "Settings" > "Bindings"
   - Add a new Browser binding named "browser"

4. **Deploy the Worker**:
   - Run the following command from the repository root:
     ```
     npx wrangler deploy
     ```
   - Note the URL of your deployed worker (e.g., `https://browser-rendering-api.yourusername.workers.dev`)

5. **Update MCP Configuration**:
   - Use your worker's URL as the `BROWSER_RENDERING_API` value in the MCP settings

### Testing Your Worker

To verify your worker is functioning correctly:

```bash
# Test the content endpoint
curl -X POST https://your-worker-url.workers.dev/content \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'

# Test the screenshot endpoint
curl -X POST https://your-worker-url.workers.dev/screenshot \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

## Usage

Once configured, you can use the following tools in Cline:

### Fetch Page

Fetches and processes a web page for LLM context:

```
Use the fetch_page tool to get content from "https://example.com"
```

Parameters:
- `url` (required): URL to fetch
- `maxContentLength` (optional): Maximum content length to return (default: 10000)

### Search Documentation

Searches Cloudflare documentation and returns relevant content:

```
Use the search_documentation tool to find information about "browser rendering api"
```

Parameters:
- `query` (required): Search query
- `maxResults` (optional): Maximum number of results to return (default: 3)

### Extract Structured Content

Extracts structured content from a web page using CSS selectors:

```
Use the extract_structured_content tool to get content from "https://example.com" with selectors {"title": "h1", "paragraph": "p"}
```

Parameters:
- `url` (required): URL to extract content from
- `selectors` (required): CSS selectors to extract content

### Summarize Content

Summarizes web content for more concise LLM context:

```
Use the summarize_content tool to summarize "https://example.com"
```

Parameters:
- `url` (required): URL to summarize
- `maxLength` (optional): Maximum length of the summary (default: 500)

## Configuration Options

You can customize the MCP server by setting these environment variables:

- `BROWSER_RENDERING_API`: The URL of the Cloudflare Browser Rendering API endpoint

## Troubleshooting

If you encounter issues:

1. **MCP Server Issues**:
   - Check that the Cloudflare Browser Rendering API endpoint is correctly configured
   - Verify that the API endpoint is accessible from your network
   - Check the Cline logs for any error messages

2. **Cloudflare Worker Issues**:
   - Ensure your Cloudflare account has access to the Browser Rendering API
   - Verify the Browser binding is correctly set up in your worker
   - Check the Cloudflare Workers logs in the dashboard for any errors
   - Make sure your worker's ALLOWED_ORIGINS includes your domain or localhost
   - If you're getting timeout errors, try increasing the timeout value in the worker

3. **Content Extraction Issues**:
   - Some websites may block headless browsers or have anti-scraping measures
   - Try adjusting the waitUntil parameter (e.g., 'networkidle0', 'domcontentloaded')
   - For complex sites, you may need to implement additional waiting logic

## Development

To make changes to the server:

1. Edit the source code in `<path-to-repository>/src/`
2. Rebuild the server:
   ```
   cd <path-to-repository>
   npm run build
   ```
3. Restart Cline to apply the changes

## How It Works

The Cloudflare Browser Rendering MCP server leverages Cloudflare's serverless headless browser service to:

1. Render JavaScript-heavy websites
2. Process and clean HTML content for LLM consumption
3. Extract structured data from web pages
4. Generate summaries of web content

This allows Cline to access and understand web content that would otherwise be difficult to process, providing richer context for your interactions.

## Technical Details

### Architecture

The server consists of several key components:

- **BrowserClient**: Handles communication with the Cloudflare Browser Rendering API
- **ContentProcessor**: Cleans and formats HTML content for LLM consumption
- **MCP Server**: Exposes the functionality as tools through the Model Context Protocol

### API Endpoints

The server communicates with the following Cloudflare Browser Rendering API endpoints:

- `/content`: Fetches rendered HTML content from a URL
- `/screenshot`: Takes a screenshot of a URL (currently disabled)
- `/scrape`: Extracts specific content using CSS selectors

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
