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

The server has been installed and configured for use with Cline. To complete the setup:

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
       "BROWSER_RENDERING_API": "https://browser-rendering-api.as186v.workers.dev"
     },
     "disabled": false,
     "autoApprove": []
   }
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

1. Check that the Cloudflare Browser Rendering API endpoint is correctly configured
2. Verify that the API endpoint is accessible from your network
3. Check the Cline logs for any error messages

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
