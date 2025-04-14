'use client';

import { useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [articleTitle, setArticleTitle] = useState('Article Summarizer');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSummary('');
    
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

      const data = await response.json();
      setSummary(data.summary);
    } catch (err) {
      setError('Failed to generate summary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Wikipedia-style header */}
      <header className="bg-[#f6f6f6] border-b border-[#a2a9b1]">
        <div className="max-w-4xl mx-auto px-4 py-2 flex items-center">
          <div className="flex-1">
            <h1 className="text-2xl font-serif text-[#202122]">{articleTitle}</h1>
          </div>
          <div className="text-sm text-[#54595d]">
            <a href="#" className="hover:underline">Help</a>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white">
          {/* Wikipedia-style article title */}
          <h1 className="text-3xl font-serif font-normal text-[#202122] border-b border-[#a2a9b1] pb-2 mb-4">
            {articleTitle}
          </h1>
          
          {/* Wikipedia-style form */}
          <form onSubmit={handleSubmit} className="mb-6">
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

          {summary && (
            <div className="bg-white">
              <h2 className="text-xl font-serif font-normal text-[#202122] border-b border-[#a2a9b1] pb-2 mb-4">
                Summary
              </h2>
              <div className="prose prose-sm max-w-none">
                <p className="text-[#202122] leading-relaxed">{summary}</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Wikipedia-style footer */}
      <footer className="bg-[#f6f6f6] border-t border-[#a2a9b1] mt-8">
        <div className="max-w-4xl mx-auto px-4 py-3 text-sm text-[#54595d]">
          <p>This page was last edited on {new Date().toLocaleDateString()}</p>
        </div>
      </footer>
    </div>
  );
}
