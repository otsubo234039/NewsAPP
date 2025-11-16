require 'yaml'
require 'open-uri'
require 'rss'
require 'json'

raw = File.read(File.join(__dir__, 'config', 'feeds.yml')) rescue nil
cfg = nil
begin
  cfg = YAML.safe_load(raw, aliases: true)
rescue => e
  STDERR.puts "failed to load feeds.yml: #{e.class}: #{e.message}"
  exit 1
end

sources = cfg.dig('feeds', 'it', 'sources') rescue nil
unless sources && sources.any?
  puts "no sources found in feeds.yml"
  exit 0
end

sources.each do |s|
  url = s['url']
  title = s['title']
  puts "\n=== Source: #{title} | #{url} ==="
  begin
    URI.open(url, open_timeout: 8, read_timeout: 15) do |io|
      meta = io.respond_to?(:meta) ? io.meta : {}
      puts "open-uri meta: #{meta.inspect}"
      begin
        feed = RSS::Parser.parse(io, false)
      rescue => parse_e
        STDERR.puts "RSS::Parser.parse failed: #{parse_e.class}: #{parse_e.message}"
        STDERR.puts parse_e.full_message
        # try reading raw body for diagnostics
        begin
          raw_body = io.read
          puts "raw body (first 400 bytes):"
          puts raw_body.force_encoding('UTF-8')[0,400].inspect
        rescue => re
          STDERR.puts "failed to read raw body for diagnostics: #{re.class}: #{re.message}"
        end
        next
      end

      if feed
        puts "parsed feed class=#{feed.class}, items=#{feed.items.size}"
        feed.items.first(3).each_with_index do |it, idx|
          pub = (it.respond_to?(:pubDate) && it.pubDate) || (it.respond_to?(:published) && it.published)
          puts "[#{idx}] title=#{it.title.to_s.inspect} pub=#{pub.inspect} link=#{it.link.to_s}"
        end
      else
        puts "no feed parsed"
      end
    end
  rescue => e
    STDERR.puts "failed to open #{url}: #{e.class}: #{e.message}"
    STDERR.puts e.full_message
  end
end
