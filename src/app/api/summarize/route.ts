import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Fetch the article content
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $('script, style, nav, header, footer, .ads, .comments').remove();

    // Extract the main content
    const title = $('h1').first().text().trim();
    const content = $('article, .article, .post, main, .content')
      .text()
      .replace(/\s+/g, ' ')
      .trim();

    if (!content) {
      return NextResponse.json(
        { error: 'Could not extract article content' },
        { status: 400 }
      );
    }

    // Generate summary using Claude
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `Please write a summary of this article titled ${title} and the content is ${content}. Structure the summary into three sections: 1. Summary, 2. Thesis and supporting evidence, 3. Context of this post in broader discussion, and 4. Give a rating of the article from 1 to 10 focusing on areas for improvement. `
        }
      ]
    });

    // Access the text content correctly based on the Anthropic SDK types
    const summaryText = message.content[0].type === 'text' 
      ? message.content[0].text 
      : 'Failed to generate summary';

    return NextResponse.json({
      summary: summaryText
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to process the article' },
      { status: 500 }
    );
  }
} 