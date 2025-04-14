import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Extracts the main content from an article URL
 * @param url The URL of the article to extract content from
 * @returns The extracted article content as a string
 */
export async function getArticleContent(url: string): Promise<string> {
  try {
    // Fetch the HTML content
    const response = await axios.get(url);
    const html = response.data;
    
    // Parse the HTML with cheerio
    const $ = cheerio.load(html);
    
    // Remove script and style elements
    $('script, style').remove();
    
    // Try to find the main content
    // This is a simple approach - for production, you might want to use a more sophisticated
    // content extraction library like Readability or Mercury Parser
    let content = '';
    
    // Try common article selectors
    const selectors = [
      'article',
      '[role="main"]',
      '.article-content',
      '.post-content',
      '.entry-content',
      'main',
      '#content',
      '.content'
    ];
    
    for (const selector of selectors) {
      const element = $(selector);
      if (element.length > 0) {
        content = element.text();
        break;
      }
    }
    
    // If no content found with selectors, fall back to body
    if (!content) {
      content = $('body').text();
    }
    
    // Clean up the content
    content = content
      .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
      .replace(/\n+/g, '\n') // Replace multiple newlines with a single newline
      .trim();
    
    return content;
  } catch (error) {
    console.error('Error extracting article content:', error);
    throw new Error('Failed to extract article content');
  }
} 