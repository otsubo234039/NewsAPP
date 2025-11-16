begin
  RssFeedService.fetch('it')
  puts "OK"
rescue => e
  puts "EXCEPTION: #{e.class}: #{e.message}"
  puts e.backtrace.join("\n")
end
