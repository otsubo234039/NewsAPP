# NewsAPP

A personalized news aggregation application that displays news articles based on user-selected tags and interests using the NewsAPI.

## Features

- 🏷️ Tag-based news filtering
- 📰 Real-time news from NewsAPI
- 🎨 Modern, responsive UI with Tailwind CSS
- ⚡ Fast and efficient with Next.js and Rails API
- 🔄 Dynamic tag selection for personalized news feed

## Tech Stack

### Frontend
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: React

### Backend
- **Framework**: Ruby on Rails 8.1 (API mode)
- **Database**: PostgreSQL
- **External API**: NewsAPI

## Project Structure

```
NewsAPP/
├── frontend/          # Next.js frontend application
│   ├── app/          # Next.js app directory
│   ├── components/   # React components
│   └── lib/          # API client and utilities
└── backend/          # Rails API backend
    ├── app/
    │   ├── controllers/  # API controllers
    │   └── models/       # Database models
    └── db/              # Database migrations and seeds
```

## Setup Instructions

### Prerequisites

- Node.js 20+ and npm
- Ruby 3.2+
- PostgreSQL
- NewsAPI key (get one free at [https://newsapi.org/](https://newsapi.org/))

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
bundle install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env and add your NewsAPI key
```

4. Create and set up the database:
```bash
rails db:create
rails db:migrate
rails db:seed
```

5. Start the Rails server:
```bash
rails server -p 3001
```

The backend API will be available at `http://localhost:3001`.

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
# The default API URL should work if backend is on port 3001
```

4. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`.

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Select your interests by clicking on the tags in the "Select Your Interests" section
3. The news feed will automatically update to show articles related to your selected tags
4. Click on any article to read the full story on the original source
5. Use the refresh button to get the latest news

## API Endpoints

### Backend API (Port 3001)

- `GET /api/v1/tags` - Get all available tags
- `GET /api/v1/user_tags?user_id=1` - Get user's selected tags
- `POST /api/v1/user_tags` - Add a tag to user preferences
- `DELETE /api/v1/user_tags/:id` - Remove a tag from user preferences
- `GET /api/v1/news?user_id=1` - Get news articles based on user's tag preferences

## Available Tags

The app comes pre-seeded with the following interest categories:
- Technology
- Business
- Sports
- Entertainment
- Science
- Health
- Politics
- Climate
- Finance
- Education

## Development

### Frontend Development
```bash
cd frontend
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run ESLint
```

### Backend Development
```bash
cd backend
rails server     # Start Rails server
rails console    # Open Rails console
rails db:migrate # Run migrations
rails db:seed    # Seed database
```

## Environment Variables

### Backend (.env)
- `NEWS_API_KEY` - Your NewsAPI key

### Frontend (.env.local)
- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:3001)

## License

This project is open source and available under the MIT License.

## Credits

News data provided by [NewsAPI](https://newsapi.org/)