# tmp script to list users
puts "=== Users dump (id, name, email, created_at) ==="
User.all.each do |u|
  puts "id=#{u.id} name=#{u.name.inspect} email=#{u.email.inspect} created_at=#{u.created_at}"
end
puts "=== count=#{User.count} ==="
