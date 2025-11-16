require 'json'
begin
  res = RssFeedService.fetch('it')
  puts JSON.pretty_generate(res ? res : { result: nil })
rescue => e
  STDERR.puts e.full_message
  exit 1
end
