begin
  puts "Deleting cache key 'rss:it'..."
  Rails.cache.delete('rss:it')
  puts "cache_exists_after_delete=#{Rails.cache.exist?('rss:it')}"
  res = RssFeedService.fetch('it')
  puts "fetched_count=#{res.length}"
  pp res[0..2]
rescue => e
  puts "ERROR: #{e.class} #{e.message}"
  puts e.backtrace.join("\n")
end
