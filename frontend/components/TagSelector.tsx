'use client';

import { useState, useEffect } from 'react';
import { Tag, UserTag, getTags, getUserTags, addUserTag, removeUserTag } from '@/lib/api';

export default function TagSelector() {
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [userTags, setUserTags] = useState<UserTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [tags, selectedTags] = await Promise.all([getTags(), getUserTags()]);
      setAllTags(tags);
      setUserTags(selectedTags);
    } catch (err) {
      setError('Failed to load tags');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTag = async (tag: Tag) => {
    try {
      const existingUserTag = userTags.find(ut => ut.tag_id === tag.id);
      
      if (existingUserTag) {
        await removeUserTag(existingUserTag.id);
        setUserTags(userTags.filter(ut => ut.id !== existingUserTag.id));
      } else {
        const newUserTag = await addUserTag(tag.id);
        setUserTags([...userTags, newUserTag]);
      }
    } catch (err) {
      setError('Failed to update tag preference');
      console.error(err);
    }
  };

  const isTagSelected = (tagId: number) => {
    return userTags.some(ut => ut.tag_id === tagId);
  };

  if (loading) {
    return <div className="text-center py-4">Loading tags...</div>;
  }

  if (error) {
    return <div className="text-red-600 text-center py-4">{error}</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Select Your Interests</h2>
      <p className="text-gray-600 mb-4">
        Choose topics you&apos;re interested in to personalize your news feed
      </p>
      <div className="flex flex-wrap gap-2">
        {allTags.map(tag => (
          <button
            key={tag.id}
            onClick={() => handleToggleTag(tag)}
            className={`px-4 py-2 rounded-full font-medium transition-colors ${
              isTagSelected(tag.id)
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {tag.name}
          </button>
        ))}
      </div>
    </div>
  );
}
