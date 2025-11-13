'use client';

import { useState, useEffect } from 'react';
import { Article, getNews } from '@/lib/api';
import NewsCard from './NewsCard';

export default function NewsFeed() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      const response = await getNews();
      if (response.message) {
        setMessage(response.message);
      }
      setArticles(response.articles || []);
    } catch (err) {
      setError('Failed to load news. Please make sure the backend is running and NewsAPI key is configured.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadNews();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-xl text-gray-600">Loading news...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={handleRefresh}
          className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (message || articles.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <p className="text-yellow-800 mb-4">
          {message || 'No news articles found. Please select some interests above.'}
        </p>
        <button
          onClick={handleRefresh}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Your News Feed</h2>
        <button
          onClick={handleRefresh}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article, index) => (
          <NewsCard key={index} article={article} />
        ))}
      </div>
    </div>
  );
}
