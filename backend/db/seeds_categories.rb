# Categories seed for IT-students taxonomy
categories = [
  { "name" => "テクノロジー", "slug" => "technology" },
  { "name" => "ソフトウェア", "slug" => "software" },
  { "name" => "開発", "slug" => "development" },
  { "name" => "プログラミング言語", "slug" => "programming-languages" },
  { "name" => "JavaScript", "slug" => "javascript" },
  { "name" => "Python", "slug" => "python" },
  { "name" => "Ruby", "slug" => "ruby" },
  { "name" => "Go", "slug" => "go" },
  { "name" => "フレームワーク・ライブラリ", "slug" => "frameworks-libraries" },
  { "name" => "React / Next.js", "slug" => "react-nextjs" },
  { "name" => "Rails", "slug" => "rails" },
  { "name" => "Django", "slug" => "django" },
  { "name" => "ツールとワークフロー", "slug" => "tools-workflow" },
  { "name" => "IDE / エディタ", "slug" => "ide-editor" },
  { "name" => "バージョン管理 / Git", "slug" => "git" },
  { "name" => "CI / CD", "slug" => "ci-cd" },
  { "name" => "テスト", "slug" => "testing" },
  { "name" => "クラウド / インフラ", "slug" => "cloud-infra" },
  { "name" => "DevOps / SRE", "slug" => "devops-sre" },
  { "name" => "コンテナ / Docker", "slug" => "containers-docker" },
  { "name" => "データベース", "slug" => "databases" },
  { "name" => "SQL / RDBMS", "slug" => "sql-rdbms" },
  { "name" => "NoSQL", "slug" => "nosql" },
  { "name" => "コンピュータサイエンス基礎", "slug" => "cs-fundamentals" },
  { "name" => "アルゴリズム・データ構造", "slug" => "algorithms-ds" },
  { "name" => "オペレーティングシステム", "slug" => "operating-systems" },
  { "name" => "ネットワーキング", "slug" => "networking" },
  { "name" => "AI / 機械学習", "slug" => "ai-ml" },
  { "name" => "セキュリティ", "slug" => "security" },
  { "name" => "Web / フロントエンド", "slug" => "web-frontend" },
  { "name" => "モバイル", "slug" => "mobile" },
  { "name" => "キャリア・就職活動", "slug" => "career-job-hunting" },
  { "name" => "インターンシップ", "slug" => "internships" },
  { "name" => "面接準備", "slug" => "interview-prep" },
  { "name" => "履歴書・ポートフォリオ", "slug" => "resume-portfolio" },
  { "name" => "学習リソース", "slug" => "learning-resources" },
  { "name" => "チュートリアル・講座", "slug" => "tutorials-courses" },
  { "name" => "プロジェクト・OSS", "slug" => "projects-open-source" },
  { "name" => "イベント・ミートアップ", "slug" => "events-meetups" },
  { "name" => "ソフトスキル", "slug" => "soft-skills" }
]

categories.each do |c|
  Category.find_or_create_by!(slug: c['slug']) do |cat|
    cat.name = c['name']
  end
end

puts "Seeded #{Category.count} categories"
