# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Load categories from bundled seed file (idempotent)
begin
	require_relative 'seeds_categories'
rescue LoadError => e
	puts "Could not load seeds_categories: #{e.message}"
end
