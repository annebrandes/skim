import { NextRequest, NextResponse } from 'next/server';
import { getArticleContent } from '../../utils/articleExtractor';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  // Validate API key presence
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is not configured');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  try {
    const { url, question } = await request.json();

    if (!url || !question) {
      return NextResponse.json(
        { error: 'URL and question are required' },
        { status: 400 }
      );
    }

    // Get the article content
    const articleContent = await getArticleContent(url);

    // Create a streaming response
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    // Process the request asynchronously
    (async () => {
      try {
        const messageStream = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20240620',
          max_tokens: 4000,
          temperature: 0.2,
          stream: true,
          messages: [
            {
              role: 'user',
              content: `You are an AI assistant helping to answer questions about an article. 
              
              Here is the article content:
              ${articleContent}
              
              Question: ${question}
              
              Please provide a clear, concise answer based only on the information in the article. 
              If the article doesn't contain information to answer the question, say so.
              Format your response in Markdown.`
            }
          ],
        });

        // Stream the response
        for await (const chunk of messageStream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            await writer.write(encoder.encode(chunk.delta.text));
          }
        }
      } catch (error) {
        console.error('Error processing question:', error);
        await writer.write(encoder.encode('Error processing your question. Please try again.'));
      } finally {
        await writer.close();
      }
    })();

    return new NextResponse(stream.readable, {
      headers: {
        'Content-Type': 'text/plain',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('Error in ask endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to process question' },
      { status: 500 }
    );
  }
} 