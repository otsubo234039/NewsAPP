/**
 * DrawerSection コンポーネント
 */

import React from 'react';
import { useRouter } from 'next/router';

interface DrawerSectionProps {
  showDrawer: boolean;
  onClose: () => void;
  loggedInUser: string | null;
  onLogout: () => void;
  onLoginClick: () => void;
  tagList: any[];
  selectedCategories: string[];
  categoryArticleCounts: Record<string, number>;
  onToggleCategory: (slug: string) => void;
  onSaveCategories: () => void;
  onClearCategories: () => void;
}

export const DrawerSection: React.FC<DrawerSectionProps> = ({
  showDrawer,
  onClose,
  loggedInUser,
  onLogout,
  onLoginClick,
  tagList,
  selectedCategories,
  categoryArticleCounts,
  onToggleCategory,
  onSaveCategories,
  onClearCategories,
}) => {
  const router = useRouter();

  if (!showDrawer) return null;

  return (
    <div>
      <div className="drawer-overlay" onClick={onClose} />
      <aside className="drawer">
        <div className="drawer-header">
          <strong>メニュー</strong>
          <button className="drawer-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="drawer-section">
          {loggedInUser ? (
            <>
              <div style={{ marginBottom: 8 }}>
                ログイン中: <strong>{loggedInUser}</strong>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="primary" onClick={onLogout}>
                  ログアウト
                </button>
              </div>
            </>
          ) : (
            <button className="primary" onClick={onLoginClick}>
              ログイン / 登録
            </button>
          )}
        </div>

        <div className="drawer-section">
          <strong>カテゴリ選択</strong>
          <div className="category-list">
            {!tagList || tagList.length === 0 ? (
              <div style={{ color: '#666', marginTop: 8 }}>カテゴリが登録されていません</div>
            ) : (
              (() => {
                const topParents = tagList.filter(
                  (t: any) => t.parent_id === null || t.parent_id === undefined
                );
                const childrenByParent: Record<string, any[]> = {};
                for (const t of tagList) {
                  if (t.parent_id) {
                    childrenByParent[String(t.parent_id)] = childrenByParent[String(t.parent_id)] || [];
                    childrenByParent[String(t.parent_id)].push(t);
                  }
                }

                return (
                  <>
                    <div
                      style={{
                        maxHeight: 300,
                        overflowY: 'auto',
                        marginTop: 8,
                        border: '1px solid rgba(0,0,0,0.1)',
                        borderRadius: 8,
                        padding: 8,
                      }}
                    >
                      {topParents.map((parent: any) => {
                        const children = childrenByParent[String(parent.id)] || [];
                        return (
                          <div key={parent.id} style={{ marginBottom: 12 }}>
                            <div
                              style={{
                                fontWeight: 700,
                                fontSize: 13,
                                marginBottom: 6,
                                color: 'var(--text-color-light)',
                                paddingLeft: 4,
                              }}
                            >
                              {parent.name}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {children.map((child: any) => {
                                const isSelected = selectedCategories.includes(child.slug);
                                const parentCount = categoryArticleCounts[parent.slug] || 0;
                                const articleCount = (categoryArticleCounts[child.slug] ?? parentCount) || 0;
                                return (
                                  <label
                                    key={child.slug}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 8,
                                      cursor: 'pointer',
                                      padding: '6px 8px',
                                      borderRadius: 4,
                                      transition: 'background 0.15s',
                                      userSelect: 'none',
                                    }}
                                    onMouseEnter={(e) =>
                                      (e.currentTarget.style.background = 'rgba(0,0,0,0.03)')
                                    }
                                    onMouseLeave={(e) =>
                                      (e.currentTarget.style.background = 'transparent')
                                    }
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => onToggleCategory(child.slug)}
                                      style={{ width: 16, height: 16, cursor: 'pointer' }}
                                    />
                                    <span style={{ fontSize: 13, flex: 1 }}>{child.name}</span>
                                    <span style={{ fontSize: 12, color: '#666', marginLeft: 4 }}>
                                      ({articleCount})
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {loggedInUser && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <button
                          className="primary"
                          style={{ flex: 1 }}
                          onClick={onSaveCategories}
                        >
                          保存
                        </button>
                        <button
                          style={{
                            flex: 1,
                            padding: '8px 16px',
                            borderRadius: 8,
                            border: '1px solid rgba(0,0,0,0.1)',
                            background: '#dc3545',
                            color: '#fff',
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                          onClick={onClearCategories}
                        >
                          クリア
                        </button>
                      </div>
                    )}
                  </>
                );
              })()
            )}
          </div>
        </div>
      </aside>
    </div>
  );
};
