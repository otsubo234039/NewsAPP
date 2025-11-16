begin
  arr = RssFeedService.fetch('it')
  puts "fetched=#{arr.size}"
  puts arr.first(5).map(&:to_json)
rescue => e
  puts "ERROR: #{e.class}: #{e.message}"
  puts e.backtrace.join("\n")
end
