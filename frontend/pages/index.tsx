import React, { useState, useEffect } from 'react';


interface Article {
  id: string;
  title: string;
  summary: string;
  imageUrl: string;
  category: string;
}

interface ArticleCardProps {
  article: Article;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  return (
    <div className="article-card">
      <img src={article.imageUrl} alt={article.title} className="article-image" />
      <div className="article-content">
        <span className="article-category">{article.category}</span>
        <h3 className="article-title">{article.title}</h3>
        <p className="article-summary">{article.summary}</p>
      </div>
    </div>
  );
};

const HomeScreen: React.FC = () => {
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const dummyData: Article[] = [
          { id: '1', title: 'TypeScript 5.5 リリース！', summary: '新しい型推論の機能が追加されました。', imageUrl: 'https://via.placeholder.com/300x150?text=TypeScript', category: 'テクノロジー' },
          { id: '2', title: '大阪で新しいカフェがオープン', summary: '梅田駅近くに、こだわりのコーヒー豆を使用したカフェが開店しました。', imageUrl: 'https://via.placeholder.com/300x150?text=Cafe', category: 'ライフスタイル' },
          { id: '3', title: '週末の天気予報', summary: '土曜日は晴れますが、日曜日は全国的に雨の予報です。', imageUrl: 'https://via.placeholder.com/300x150?text=Weather', category: '天気' },
          { id: '4', title: 'スポーツ速報：決勝戦の結果', summary: '昨夜行われた決勝戦は、劇的な逆転勝利となりました。', imageUrl: 'https://via.placeholder.com/300x150?text=Sports', category: 'スポーツ' },
        ];
        
        setAllArticles(dummyData);
        
      } catch (err) {
        setError('データの取得に失敗しました。');
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticles();
  }, []); 

  const filteredArticles = allArticles.filter(article =>
    article.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="loading-message">読み込み中...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="home-screen">
      <header className="home-header">
        <h1>今日のニュース</h1>
        
        <div className="search-bar-container">
          <input
            type="text"
            placeholder="タイトルで記事を検索..."
            className="search-input"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </header>
      
      <main className="article-list-container">
        {filteredArticles.length > 0 ? (
          filteredArticles.map(article => (
            <ArticleCard key={article.id} article={article} />
          ))
        ) : (
          <p className="no-results-message">該当する記事が見つかりません。</p>
        )}
      </main>
    </div>
  );
};

export default HomeScreen;