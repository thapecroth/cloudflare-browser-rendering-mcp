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

  /**
   * Takes a screenshot of a URL
   * @param url The URL to take a screenshot of
   * @param options Optional screenshot parameters
   * @returns The URL to the screenshot
   */
  async takeScreenshot(url: string, options: {
    width?: number;
    height?: number;
    fullPage?: boolean;
    waitUntil?: string;
    timeout?: number;
  } = {}): Promise<string> {
    try {
      console.log(`Taking screenshot of: ${url}`);
      
      // Validate URL before sending
      try {
        new URL(url); // Will throw if URL is invalid
      } catch (e) {
        throw new Error(`Invalid URL provided: ${url}`);
      }
      
      // Add timeout for the request
      const requestTimeout = options.timeout || 30000;
      
      // Make the API call to the Cloudflare Worker with timeout
      const response = await axios.post(`${this.apiEndpoint}/screenshot`, {
        url,
        width: options.width || 1280,
        height: options.height || 800,
        fullPage: options.fullPage || false,
        waitUntil: options.waitUntil || 'networkidle0',
        timeout: requestTimeout,
      }, {
        timeout: requestTimeout + 5000, // Add 5 seconds to the request timeout
      });
      
      // Check if the response has the expected structure with a URL
      if (response.data && response.data.url) {
        // Validate the returned URL
        try {
          new URL(response.data.url);
          return response.data.url;
        } catch (e) {
          throw new Error(`Invalid screenshot URL returned: ${response.data.url}`);
        }
      }
      
      // If we can't find the URL, log the response and throw an error
      console.error('Unexpected response structure:', JSON.stringify(response.data, null, 2));
      throw new Error('Screenshot URL not found in Cloudflare Worker response');
    } catch (error: any) {
      console.error('Error taking screenshot:', error);
      
      // If API is unavailable, throw an error
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || !process.env.BROWSER_RENDERING_API) {
        console.error('Cloudflare worker API is unavailable or not configured');
        throw new Error('Cloudflare worker API is unavailable or not configured. Please check your BROWSER_RENDERING_API environment variable.');
      }
      
      // Handle timeout errors specifically
      if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT' || error.message?.includes('timeout')) {
        throw new Error(`Screenshot request timed out for URL: ${url}. Try increasing the timeout value.`);
      }
      
      // Log more detailed error information if available
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      }
      
      throw new Error(`Failed to take screenshot: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
