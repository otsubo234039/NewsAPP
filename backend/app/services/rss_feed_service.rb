require 'open-uri'
require 'rss'

class RssFeedService
  # Fetch and parse feeds for a given category key (e.g. 'it').
  # Returns an array of normalized article hashes.
  def self.fetch(category = 'it')
    cfg = Rails.application.config_for(:feeds)
    category_cfg = cfg.dig('feeds', category)
    return [] unless category_cfg && category_cfg['sources']

    cache_key = "rss:#{category}"
    Rails.cache.fetch(cache_key, expires_in: category_cfg['cache_seconds'].to_i.seconds) do
      sources = category_cfg['sources']
      articles = []

      sources.each do |s|
        begin
          open(s['url'], open_timeout: 5, read_timeout: 10) do |io|
            feed = RSS::Parser.parse(io, false)
            next unless feed

            feed.items.each do |item|
              articles << {
                title: item.title.to_s,
                link: item.link.to_s,
                summary: (item.respond_to?(:summary) && item.summary) || (item.respond_to?(:description) && item.description) || '',
                published: (item.respond_to?(:pubDate) && item.pubDate) || (item.respond_to?(:published) && item.published) || nil,
                source: s['title']
              }
            end
          end
        rescue => e
          Rails.logger.warn("RssFeedService: failed to fetch #{s['url']} — #{e.class}: #{e.message}")
          next
        end
      end

      # sort by published desc where possible
      articles.sort_by { |a| a[:published] ? -a[:published].to_i : 0 }
    end
  end
end
