puts "Deleting cache key 'rss:it'..."
Rails.cache.delete('rss:it')
puts "Cache deleted. Running fetch..."
articles = RssFeedService.fetch('it')
if articles.nil?
  puts "RssFeedService.fetch returned nil"
  exit 1
end
puts "fetched_count=#{articles.length}"
puts articles.first(10).map do |a|
  {
    title: a[:title],
    source: a[:source],
    link: a[:link],
    published: (a[:published].respond_to?(:iso8601) ? a[:published].iso8601 : a[:published])
  }
end.to_json
