const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Tag {
  id: number;
  name: string;
}

export interface UserTag {
  id: number;
  user_id: number;
  tag_id: number;
  tag: Tag;
}

export interface Article {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: {
    name: string;
  };
  author: string;
}

export interface NewsResponse {
  articles: Article[];
  totalResults?: number;
  message?: string;
}

// Get all available tags
export async function getTags(): Promise<Tag[]> {
  const response = await fetch(`${API_URL}/api/v1/tags`);
  if (!response.ok) throw new Error('Failed to fetch tags');
  return response.json();
}

// Get user's selected tags
export async function getUserTags(userId: number = 1): Promise<UserTag[]> {
  const response = await fetch(`${API_URL}/api/v1/user_tags?user_id=${userId}`);
  if (!response.ok) throw new Error('Failed to fetch user tags');
  return response.json();
}

// Add a tag to user preferences
export async function addUserTag(tagId: number, userId: number = 1): Promise<UserTag> {
  const response = await fetch(`${API_URL}/api/v1/user_tags`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user_id: userId, tag_id: tagId }),
  });
  if (!response.ok) throw new Error('Failed to add tag');
  return response.json();
}

// Remove a tag from user preferences
export async function removeUserTag(userTagId: number): Promise<void> {
  const response = await fetch(`${API_URL}/api/v1/user_tags/${userTagId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to remove tag');
}

// Get news articles based on user preferences
export async function getNews(userId: number = 1): Promise<NewsResponse> {
  const response = await fetch(`${API_URL}/api/v1/news?user_id=${userId}`);
  if (!response.ok) throw new Error('Failed to fetch news');
  return response.json();
}
