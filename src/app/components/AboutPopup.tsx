'use client';

import React from 'react';

interface AboutPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutPopup({ isOpen, onClose }: AboutPopupProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-5 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
        <h2 className="text-2xl font-serif mb-4">About Skimmer</h2>
        <div className="prose prose-sm">
          <p className="mb-4">
            Skimmer is an intelligent article summarization tool that helps you quickly understand the key points of any article. Simply paste a URL, and Skimmer will generate a comprehensive summary including:
          </p>
          <ul className="list-disc pl-5 mb-4">
            <li>A concise overview of the main content</li>
            <li>The thesis and supporting evidence</li>
            <li>Broader context and implications</li>
            <li>A quality rating with improvement suggestions</li>
          </ul>
          <p>
            You can also ask follow-up questions about the article to dive deeper into specific aspects that interest you.
          </p>
        </div>
      </div>
    </div>
  );
} 