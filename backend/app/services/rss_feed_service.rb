require 'open-uri'
require 'rss'
require 'yaml'

class RssFeedService
  # Fetch and parse feeds for a given category key (e.g. 'it').
  # Returns an array of normalized article hashes.
  def self.fetch(category = 'it')
    begin
      cfg = Rails.application.config_for(:feeds)
    rescue Psych::Exception => e
      Rails.logger.warn("RssFeedService: config_for(:feeds) failed: #{e.class}: #{e.message}; falling back to manual YAML load")
      raw = File.read(Rails.root.join('config', 'feeds.yml'))
      # enable YAML aliases (anchors) which may be used in feeds.yml
      cfg = YAML.safe_load(raw, aliases: true)
    end
    # If config_for returned nil (e.g. feeds.yml isn't environment-scoped), fall back to manual load
    if cfg.nil?
      Rails.logger.info("RssFeedService: config_for(:feeds) returned nil — falling back to manual YAML load")
      raw = File.read(Rails.root.join('config', 'feeds.yml'))
      cfg = YAML.safe_load(raw, aliases: true)
    end
    # ensure we have a Hash with expected structure
    cfg = cfg.with_indifferent_access if cfg.respond_to?(:with_indifferent_access)
    category_cfg = cfg && cfg.dig('feeds', category)
    return [] unless category_cfg && category_cfg['sources']

    cache_key = "rss:#{category}"
    if Rails.cache.exist?(cache_key)
      Rails.logger.info("RssFeedService: cache hit for #{cache_key}")
    else
      Rails.logger.info("RssFeedService: cache miss for #{cache_key}")
    end

    Rails.cache.fetch(cache_key, expires_in: category_cfg['cache_seconds'].to_i.seconds) do
      sources = category_cfg['sources']
      articles = []
      sources.each do |s|
        Rails.logger.info("RssFeedService: fetching source=#{s['title']} url=#{s['url']}")
        begin
          URI.open(s['url'], open_timeout: 8, read_timeout: 15) do |io|
            # log any meta information available from open-uri
            begin
              meta = io.respond_to?(:meta) ? io.meta : nil
              Rails.logger.info("RssFeedService: open-uri meta for #{s['url']}: #{meta.inspect}") if meta
            rescue => meta_e
              Rails.logger.debug("RssFeedService: failed to read meta for #{s['url']}: #{meta_e.class}: #{meta_e.message}")
            end

            feed = nil
            begin
              feed = RSS::Parser.parse(io, false)
            rescue => parse_e
              Rails.logger.warn("RssFeedService: RSS::Parser failed for #{s['url']}: #{parse_e.class}: #{parse_e.message}\n" + parse_e.full_message)
              feed = nil
            end

            if feed
              Rails.logger.info("RssFeedService: parsed feed for #{s['url']} (items=#{feed.items.size})")
              count = 0
              feed.items.each do |item|
                normalized = {
                  title: item.title.to_s,
                  link: (item.respond_to?(:link) ? item.link.to_s : (item.respond_to?(:links) ? item.links.first.to_s : '')),
                  summary: (item.respond_to?(:summary) && item.summary) || (item.respond_to?(:description) && item.description) || '',
                  published: (item.respond_to?(:pubDate) && item.pubDate) || (item.respond_to?(:published) && item.published) || nil,
                  source: s['title']
                }
                # Try to extract an image URL from common locations: enclosure, media:content, or first <img> in summary/description
                begin
                  image_url = nil
                  if item.respond_to?(:enclosure) && item.enclosure && item.enclosure.respond_to?(:url)
                    image_url = item.enclosure.url.to_s
                  elsif item.respond_to?(:media_content) && item.media_content && item.media_content.respond_to?(:first) && item.media_content.first.respond_to?(:url)
                    image_url = item.media_content.first.url.to_s
                  else
                    # look for <img src="..."> in summary/description
                    summary_html = normalized[:summary].to_s
                    if summary_html =~ /<img[^>]+src=["']([^"'>]+)["']/i
                      raw_src = $1
                      begin
                        # make absolute if relative
                        image_url = URI.join(s['url'], raw_src).to_s
                      rescue
                        image_url = raw_src
                      end
                    end
                  end
                rescue => img_e
                  Rails.logger.debug("RssFeedService: failed to extract image for item: #{img_e.class}: #{img_e.message}")
                  image_url = nil
                end
                normalized[:imageUrl] = image_url
                # language detection: simple heuristic for Japanese characters
                text_for_lang = (normalized[:title].to_s + " " + normalized[:summary].to_s)
                if text_for_lang.match(/[\p{Han}\p{Hiragana}\p{Katakana}]/)
                  normalized[:lang] = 'ja'
                else
                  normalized[:lang] = 'en'
                end
                articles << normalized
                count += 1
                Rails.logger.debug("RssFeedService: normalized item from #{s['url']} -> title=#{normalized[:title].inspect} link=#{normalized[:link].inspect} published=#{normalized[:published].inspect}")
              end
              Rails.logger.info("RssFeedService: appended #{count} normalized items for #{s['url']}")
            else
              Rails.logger.warn("RssFeedService: no feed parsed for #{s['url']}")
            end
          end
        rescue => e
          Rails.logger.warn("RssFeedService: failed to fetch #{s['url']} — #{e.class}: #{e.message}\n" + e.full_message)
          next
        end
      end

      # sort by published desc where possible (be defensive about types)
      Rails.logger.info("RssFeedService: total normalized articles before sort=#{articles.size}")
      sorted = articles.sort_by do |a|
        pub = a[:published]
        ts = 0
        begin
          if pub.respond_to?(:to_time)
            ts = pub.to_time.to_i
          elsif pub.respond_to?(:to_i)
            ts = pub.to_i
          elsif pub.is_a?(String)
            ts = Time.parse(pub).to_i rescue 0
          end
        rescue => e
          Rails.logger.debug("RssFeedService: failed to normalize published value #{pub.inspect}: #{e.class}: #{e.message}")
          ts = 0
        end
        -ts
      end
      Rails.logger.info("RssFeedService: returning #{sorted.size} articles for category=#{category}")
      sorted
    end
  end
end
