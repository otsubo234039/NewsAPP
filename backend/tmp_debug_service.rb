require 'pp'
require 'yaml'

cfg = nil
begin
  cfg = Rails.application.config_for(:feeds)
rescue Psych::Exception => e
  puts "config_for failed: #{e.class}: #{e.message}"
  raw = File.read(Rails.root.join('config','feeds.yml'))
  cfg = YAML.safe_load(raw, aliases: true)
end
puts "cfg_class=#{cfg.class}"
pp cfg
category_cfg = cfg && cfg.dig('feeds','it')
puts "category_cfg=#{category_cfg.class if category_cfg}"
pp category_cfg
puts "sources_count=#{category_cfg['sources'].length if category_cfg && category_cfg['sources']}"
puts "cache_exist=#{Rails.cache.exist?('rss:it')}"
puts "--- calling fetch ---"
pp RssFeedService.fetch('it')
