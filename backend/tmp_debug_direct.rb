require 'yaml'
require 'open-uri'
require 'rss'

begin
  raw = File.read(File.join(__dir__, 'config', 'feeds.yml')) rescue nil
  cfg = YAML.safe_load(raw, aliases: true)
  cfg = cfg.with_indifferent_access if cfg.respond_to?(:with_indifferent_access)
  cat = cfg && cfg.dig('feeds', 'it')
  unless cat && cat['sources']
    puts "no category config"
    exit 1
  end
  cat['sources'].each do |s|
    puts "=== Source: #{s['title']} | #{s['url']} ==="
    begin
      URI.open(s['url'], open_timeout: 8, read_timeout: 15) do |io|
        meta = io.respond_to?(:meta) ? io.meta : nil
        puts "open-uri meta: #{meta.inspect}"
        begin
          feed = RSS::Parser.parse(io, false)
          puts "parsed feed class=#{feed.class} items=#{feed.items.size}"
          feed.items[0..2].each_with_index do |item, idx|
            link = if item.respond_to?(:link)
              item.link.to_s
            elsif item.respond_to?(:links) && item.links && item.links.first
              item.links.first.to_s
            else
              ''
            end
            pub = (item.respond_to?(:pubDate) && item.pubDate) || (item.respond_to?(:published) && item.published) || nil
            puts "[#{idx}] title=#{item.title.to_s.inspect} link=#{link.inspect} pub=#{pub.inspect}"
          end
        rescue => e
          puts "parse error: #{e.class}: #{e.message}"
          puts e.backtrace.join("\n")
        end
      end
    rescue => e
      puts "open error: #{e.class}: #{e.message}"
    end
  end
rescue => e
  puts "FATAL: #{e.class}: #{e.message}"
  puts e.backtrace.join("\n")
end
