# NewsAPP Backend (Rails API)

Rails API backend for the NewsAPP application.

## Setup

1. Install dependencies:
```bash
bundle install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env and add your NewsAPI key
```

3. Create and migrate the database:
```bash
rails db:create
rails db:migrate
rails db:seed
```

4. Start the server:
```bash
rails server -p 3001
```

The API will be available at `http://localhost:3001`.

## API Endpoints

### Tags
- `GET /api/v1/tags` - Get all available tags

### User Tags (User Preferences)
- `GET /api/v1/user_tags?user_id=1` - Get user's selected tags
- `POST /api/v1/user_tags` - Add a tag to user preferences
  - Body: `{ "user_id": 1, "tag_id": 1 }`
- `DELETE /api/v1/user_tags/:id` - Remove a tag from user preferences

### News
- `GET /api/v1/news?user_id=1` - Get news articles based on user's tag preferences

## Environment Variables

- `NEWS_API_KEY` - Your NewsAPI key (get it from https://newsapi.org/)
