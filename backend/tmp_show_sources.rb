articles = RssFeedService.fetch('it')
articles = articles.to_a if articles.respond_to?(:to_a)
puts "fetched=#{articles.length}"
puts "unique_sources=" + articles.map{|a| a[:source]}.uniq.to_json
puts "sample_items=" + articles.first(10).map{|a|
  {
    title: a[:title],
    source: a[:source],
    link: a[:link],
    published: (a[:published].respond_to?(:iso8601) ? a[:published].iso8601 : a[:published])
  }
}.to_json
