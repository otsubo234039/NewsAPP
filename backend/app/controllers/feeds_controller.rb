class FeedsController < ApplicationController
  # GET /api/articles
  # optional param: category (default: 'it')
  def index
    category = params[:category] || 'it'
    articles = RssFeedService.fetch(category)
    render json: { status: 'ok', category: category, count: articles.size, articles: articles }
  rescue => e
    Rails.logger.error("FeedsController#index error: #{e.class}: #{e.message}")
    render json: { status: 'error', message: 'failed to fetch feeds' }, status: 500
  end
end
