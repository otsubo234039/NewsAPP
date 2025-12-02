module Api
  class TagsController < ApplicationController
    # Simple tags endpoint: returns categories as flat tags to support frontend
    def index
      tags = Category.order(:name).map do |c|
        { id: c.id, name: c.name, slug: c.slug, parent_id: nil }
      end
      render json: { tags: tags }
    end
  end
end
