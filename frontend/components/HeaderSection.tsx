/**
 * HeaderSection コンポーネント
 */

import React from 'react';

interface HeaderSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: () => void;
  filteredCount: number;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  mounted: boolean;
  selectedLang: string;
  onLangChange: (lang: string) => void;
  selectedCountry: 'japan' | 'world';
  onCountryChange: (country: 'japan' | 'world') => void;
  onMenuClick: () => void;
}

export const HeaderSection: React.FC<HeaderSectionProps> = ({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  filteredCount,
  theme,
  onThemeToggle,
  mounted,
  selectedLang,
  onLangChange,
  selectedCountry,
  onCountryChange,
  onMenuClick,
}) => {
  return (
    <header className="home-header">
      <div className="header-left">
        <h1>ニュース</h1>
      </div>

      <div className="header-center" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="text"
          placeholder="記事を検索..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onSearchSubmit();
            }
          }}
          className="search-input"
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid rgba(0,0,0,0.1)',
            background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#fff',
            color: theme === 'dark' ? '#e6eef8' : '#07314a',
            fontSize: 14,
            flex: 1,
            maxWidth: 400,
          }}
        />
        <button
          onClick={onSearchSubmit}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: theme === 'dark' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.1)',
            background: theme === 'dark' ? 'linear-gradient(135deg, #1e5aa8 0%, #0b3d91 100%)' : '#0b3d91',
            color: '#fff',
            fontSize: 14,
            cursor: 'pointer',
            fontWeight: 600,
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
            boxShadow: theme === 'dark' ? '0 2px 8px rgba(30,90,168,0.3)' : 'none',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background =
              theme === 'dark' ? 'linear-gradient(135deg, #2672c7 0%, #1e5aa8 100%)' : '#0a2f7a';
            e.currentTarget.style.boxShadow =
              theme === 'dark' ? '0 4px 12px rgba(38,114,199,0.4)' : 'none';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background =
              theme === 'dark' ? 'linear-gradient(135deg, #1e5aa8 0%, #0b3d91 100%)' : '#0b3d91';
            e.currentTarget.style.boxShadow =
              theme === 'dark' ? '0 2px 8px rgba(30,90,168,0.3)' : 'none';
          }}
        >
          🔍 検索
        </button>
      </div>

      <div className="header-right" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ fontSize: 12, color: theme === 'dark' ? '#999' : '#666' }}>
          表示件数: {filteredCount}
        </div>
        <button
          className="theme-toggle"
          onClick={onThemeToggle}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: '1px solid rgba(0,0,0,0.1)',
            background: theme === 'dark' ? 'rgba(255,255,255,0.08)' : '#f5f5f5',
            color: theme === 'dark' ? '#e6eef8' : '#07314a',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            transition: 'all 0.2s',
          }}
        >
          {mounted ? (theme === 'dark' ? '☀️ ライト' : '🌙 ダーク') : ''}
        </button>

        <select
          className="lang-select"
          value={selectedLang}
          onChange={(e) => onLangChange(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid rgba(0,0,0,0.1)',
            background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#fff',
            color: theme === 'dark' ? '#e6eef8' : '#07314a',
            fontSize: 14,
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          <option value="">すべての言語</option>
          <option value="ja">日本語</option>
          <option value="en">English</option>
        </select>

        <select
          className="country-select"
          value={selectedCountry}
          onChange={(e) => onCountryChange(e.target.value as 'japan' | 'world')}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid rgba(0,0,0,0.1)',
            background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#fff',
            color: theme === 'dark' ? '#e6eef8' : '#07314a',
            fontSize: 14,
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          <option value="japan">日本</option>
          <option value="world">アメリカ</option>
        </select>

        <button className="hamburger" aria-label="メニュー" onClick={onMenuClick}>
          ☰
        </button>
      </div>
    </header>
  );
};
