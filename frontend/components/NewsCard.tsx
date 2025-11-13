import { Article } from '@/lib/api';
import Image from 'next/image';

interface NewsCardProps {
  article: Article;
}

export default function NewsCard({ article }: NewsCardProps) {
  const formattedDate = new Date(article.publishedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {article.urlToImage && (
        <div className="relative w-full h-48">
          <Image
            src={article.urlToImage}
            alt={article.title}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <span className="font-semibold">{article.source.name}</span>
          <span>•</span>
          <span>{formattedDate}</span>
        </div>
        <h2 className="text-xl font-bold mb-2 line-clamp-2">{article.title}</h2>
        {article.description && (
          <p className="text-gray-600 mb-4 line-clamp-3">{article.description}</p>
        )}
        {article.author && (
          <p className="text-sm text-gray-500 mb-3">By {article.author}</p>
        )}
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Read More
        </a>
      </div>
    </article>
  );
}
