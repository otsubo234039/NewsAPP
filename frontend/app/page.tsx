import TagSelector from '@/components/TagSelector';
import NewsFeed from '@/components/NewsFeed';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">NewsAPP</h1>
          <p className="text-gray-600 mt-1">Your personalized news aggregator</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <TagSelector />
          <NewsFeed />
        </div>
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-gray-600">
          <p>Powered by NewsAPI</p>
        </div>
      </footer>
    </div>
  );
}
