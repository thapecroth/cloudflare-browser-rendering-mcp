import axios from 'axios';

/**
 * Client for interacting with Cloudflare Browser Rendering
 */
export class BrowserClient {
  private apiEndpoint: string;

  constructor() {
    // Use the Cloudflare Worker endpoint from environment variable
    if (!process.env.BROWSER_RENDERING_API) {
      console.warn('BROWSER_RENDERING_API environment variable is not set. Please set it to your Cloudflare Worker URL.');
    }
    this.apiEndpoint = process.env.BROWSER_RENDERING_API || 'https://your-browser-rendering-api.workers.dev';
    console.log(`Initialized BrowserClient with endpoint: ${this.apiEndpoint}`);
  }

  /**
   * Fetches rendered HTML content from a URL
   * @param url The URL to fetch content from
   * @returns The rendered HTML content
   */
  async fetchContent(url: string): Promise<string> {
    try {
      console.log(`Fetching content from: ${url}`);
      
      // Make the API call to the Cloudflare Worker
      const response = await axios.post(`${this.apiEndpoint}/content`, {
        url,
        rejectResourceTypes: ['image', 'font', 'media'],
        waitUntil: 'networkidle0',
      });
      
      // Check if the response has the expected structure
      if (response.data && response.data.content) {
        return response.data.content;
      }
      
      // If we can't find the content, log the response and throw an error
      console.error('Unexpected response structure:', JSON.stringify(response.data, null, 2));
      throw new Error('Unexpected response structure from Cloudflare Worker');
    } catch (error: any) {
      console.error('Error fetching content:', error);
      
      // Log more detailed error information if available
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      }
      
      throw new Error(`Failed to fetch content: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
