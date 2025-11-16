class FeedsController < ApplicationController
  # GET /api/articles
  # optional param: category (default: 'it')
  def index
    category = params[:category] || 'it'
    begin
      articles = RssFeedService.fetch(category)
      # If service returned nil/empty, fall back to sample data for developer convenience
      if articles.nil? || articles.empty?
        Rails.logger.warn("FeedsController#index: no articles returned from service, using fallback samples")
        articles = fallback_articles
        fallback = true
      else
        fallback = false
      end

      # Ensure articles are plain JSON-serializable values (avoid potential recursive objects)
      safe_articles = articles.map do |a|
        {
          title: a[:title].to_s,
          link: a[:link].to_s,
          summary: a[:summary].to_s,
          published: (a[:published].respond_to?(:iso8601) ? a[:published].iso8601 : a[:published].to_s),
          source: a[:source].to_s,
          lang: (a[:lang] || 'und')
        }
      end

      # optional filter: only_lang=ja to return only Japanese articles
      if params[:only_lang].present?
        filter = params[:only_lang].to_s
        safe_articles = safe_articles.select { |art| art[:lang].to_s == filter }
      end

      # Optional translation: accept `lang` (single) or `langs` (comma-separated)
      langs_param = params[:langs].presence || params[:lang].presence
      if langs_param.present?
        langs = langs_param.to_s.split(',').map(&:strip).reject(&:empty?).uniq
        # Limit work: only translate first N articles (rest can be translated on-demand)
        max_to_translate = (ENV['MAX_TRANSLATE_ARTICLES'] || 10).to_i
        to_translate = safe_articles.first(max_to_translate)

        to_translate.each do |art|
          art_trans = {}
          langs.each do |lg|
            begin
              title_tr = TranslationService.translate(art[:title], lg)
              summary_tr = TranslationService.translate(art[:summary], lg)
              art_trans[lg] = { title: title_tr, summary: summary_tr }
            rescue => e
              Rails.logger.warn("FeedsController: translation failed for lang=#{lg}: #{e.class}: #{e.message}")
              art_trans[lg] = { title: '', summary: '' }
            end
          end
          art[:translations] = art_trans
        end
      end

      render json: { status: 'ok', category: category, count: safe_articles.size, articles: safe_articles, fallback: fallback }
    rescue => e
      Rails.logger.error("FeedsController#index error: #{e.class}: #{e.message}")
      articles = fallback_articles
      render json: { status: 'ok', category: category, count: articles.size, articles: articles, fallback: true }
    end
  end

  # GET /api/ping
  def ping
    render json: { status: 'ok', time: Time.now.utc }
  end

  private

  def fallback_articles
    now = Time.now
    [
      { title: 'フォールバック: TechCrunch のダミー記事', link: '#', summary: '外部フィード取得に失敗したため表示しています。', published: now.to_s, source: 'TechCrunch' },
      { title: 'フォールバック: The Verge のダミー記事', link: '#', summary: '外部フィード取得に失敗したため表示しています。', published: (now - 3600).to_s, source: 'The Verge' },
      { title: 'フォールバック: Ars Technica のダミー記事', link: '#', summary: '外部フィード取得に失敗したため表示しています。', published: (now - 7200).to_s, source: 'Ars Technica' },
      { title: 'フォールバック: Wired のダミー記事', link: '#', summary: '外部フィード取得に失敗したため表示しています。', published: (now - 10800).to_s, source: 'Wired' }
    ]
  end
end
 
