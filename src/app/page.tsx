'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

export default function Home() {
  const [url, setUrl] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [articleTitle, setArticleTitle] = useState('Drop link into skimmer');
  const summaryRef = useRef<HTMLDivElement>(null);
  
  // New state for questions
  const [question, setQuestion] = useState('');
  const [questions, setQuestions] = useState<Array<{question: string, answer: string}>>([]);
  const [askingQuestion, setAskingQuestion] = useState(false);
  const [questionError, setQuestionError] = useState('');
  const questionsRef = useRef<HTMLDivElement>(null);

  // Scroll to the bottom of the summary as it streams in
  useEffect(() => {
    if (summaryRef.current) {
      summaryRef.current.scrollTop = summaryRef.current.scrollHeight;
    }
  }, [summary]);
  
  // Scroll to the bottom of questions as they stream in
  useEffect(() => {
    if (questionsRef.current) {
      questionsRef.current.scrollTop = questionsRef.current.scrollHeight;
    }
  }, [questions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSummary('');
    setQuestions([]); // Reset questions when a new article is loaded
    
    // Extract a title from the URL
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace('www.', '');
      const pathname = urlObj.pathname.split('/').filter(Boolean).pop() || '';
      const extractedTitle = pathname 
        ? pathname.replace(/-/g, ' ').replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        : hostname;
      
      setArticleTitle(extractedTitle || 'Article Summary');
    } catch (err) {
      setArticleTitle('Article Summary');
    }

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      // Process the stream
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }
        
        // Decode the chunk and append to the summary
        const text = new TextDecoder().decode(value);
        setSummary(prev => prev + text);
      }
    } catch (err) {
      setError('Failed to generate summary. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle asking a follow-up question
  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !url) return;
    
    setAskingQuestion(true);
    setQuestionError('');
    
    // Add the question to the list immediately
    const newQuestion = { question: question.trim(), answer: '' };
    setQuestions(prev => [...prev, newQuestion]);
    
    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, question: question.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to get answer');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      // Process the stream
      let answer = '';
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }
        
        // Decode the chunk and append to the answer
        const text = new TextDecoder().decode(value);
        answer += text;
        
        // Update the last question's answer
        setQuestions(prev => {
          const updated = [...prev];
          updated[updated.length - 1].answer = answer;
          return updated;
        });
      }
    } catch (err) {
      setQuestionError('Failed to get answer. Please try again.');
    } finally {
      setAskingQuestion(false);
      setQuestion(''); // Clear the question input
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Wikipedia-style header */}
      <header className="bg-[#f6f6f6] border-b border-[#a2a9b1]">
        <div className="max-w-4xl mx-auto px-4 py-2 flex items-center">
          <div className="flex-1">
            <h1 className="text-2xl font-serif text-[#202122]"> Skimmer </h1>
          </div>
          <div className="text-sm text-[#54595d]">
            <a href="#" className="hover:underline">About</a>
          </div>
        </div>
      </header>

      <main className="max-w-4xl w-full mx-auto px-4 py-6 flex-grow">
        <div className="bg-white w-full">
          {/* Wikipedia-style article title */}
          <h1 className="text-3xl font-serif font-normal text-[#202122] border-b border-[#a2a9b1] pb-2 mb-4 w-full">
            {articleTitle}
          </h1>
          
          {/* Wikipedia-style form */}
          <form onSubmit={handleSubmit} className="mb-6 w-full">
            <div className="mb-4">
              <label htmlFor="url" className="block text-sm font-medium text-[#202122] mb-1">
                Article URL
              </label>
              <input
                type="url"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/article"
                className="w-full px-3 py-2 border border-[#a2a9b1] rounded focus:outline-none focus:ring-1 focus:ring-[#36c]"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="bg-[#36c] text-white py-1 px-3 rounded border border-[#36c] hover:bg-[#447ff5] disabled:bg-[#a2a9b1] disabled:border-[#a2a9b1]"
            >
              {loading ? 'Generating Summary...' : 'Generate Summary'}
            </button>
          </form>

          {error && (
            <div className="mb-4 p-3 bg-[#fef6f6] border border-[#ffa7a7] text-[#d33] rounded">
              {error}
            </div>
          )}

          {(summary || loading) && (
            <div className="bg-white">
              <h2 className="text-xl font-serif font-normal text-[#202122] border-b border-[#a2a9b1] pb-2 mb-4">
                Summary
              </h2>
              <div 
                ref={summaryRef}
                className="prose prose-sm max-w-none overflow-y-auto max-h-[600px] p-4 border border-[#a2a9b1] rounded"
              >
                {loading && !summary && (
                  <div className="flex items-center justify-center h-20">
                    <div className="animate-pulse text-[#54595d]">Generating summary...</div>
                  </div>
                )}
                {summary && (
                  <div className="text-[#202122] leading-relaxed">
                    <ReactMarkdown>
                      {summary}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Follow-up questions section */}
          {summary && (
            <div className="mt-8 bg-white">
              <h2 className="text-xl font-serif font-normal text-[#202122] border-b border-[#a2a9b1] pb-2 mb-4">
                Ask Questions
              </h2>
              
              <form onSubmit={handleAskQuestion} className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask a question about the article..."
                    className="flex-1 px-3 py-2 border border-[#a2a9b1] rounded focus:outline-none focus:ring-1 focus:ring-[#36c]"
                    disabled={askingQuestion}
                  />
                  <button
                    type="submit"
                    disabled={askingQuestion || !question.trim()}
                    className="bg-[#36c] text-white py-1 px-3 rounded border border-[#36c] hover:bg-[#447ff5] disabled:bg-[#a2a9b1] disabled:border-[#a2a9b1]"
                  >
                    {askingQuestion ? 'Asking...' : 'Ask'}
                  </button>
                </div>
              </form>
              
              {questionError && (
                <div className="mb-4 p-3 bg-[#fef6f6] border border-[#ffa7a7] text-[#d33] rounded">
                  {questionError}
                </div>
              )}
              
              {questions.length > 0 && (
                <div 
                  ref={questionsRef}
                  className="overflow-y-auto max-h-[600px] border border-[#a2a9b1] rounded"
                >
                  {[...questions].reverse().map((item, index) => (
                    <div key={questions.length - 1 - index} className="p-4 border-b border-[#a2a9b1] last:border-b-0">
                      <div className="font-medium text-[#202122] mb-2">
                        Q: {item.question}
                      </div>
                      <div className="text-[#202122] leading-relaxed">
                        {item.answer ? (
                          <ReactMarkdown>
                            {item.answer}
                          </ReactMarkdown>
                        ) : (
                          <div className="flex items-center justify-center h-10">
                            <div className="animate-pulse text-[#54595d]">Generating answer...</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Wikipedia-style footer */}
      <footer className="bg-[#f6f6f6] border-t border-[#a2a9b1]">
        <div className="max-w-4xl mx-auto px-4 py-3 text-sm text-[#54595d]">
          <p>This page was last edited on {new Date().toLocaleDateString()}</p>
        </div>
      </footer>
    </div>
  );
}
