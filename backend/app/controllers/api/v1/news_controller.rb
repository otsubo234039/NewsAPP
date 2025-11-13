class Api::V1::NewsController < ApplicationController
  require 'net/http'
  require 'json'

  def index
    user_id = params[:user_id] || 1
    tags = UserTag.where(user_id: user_id).includes(:tag).map { |ut| ut.tag.name }
    
    if tags.empty?
      render json: { articles: [], message: "No tags configured for user" }
      return
    end

    api_key = ENV['NEWS_API_KEY']
    if api_key.blank?
      render json: { error: "NEWS_API_KEY not configured" }, status: :service_unavailable
      return
    end

    query = tags.join(' OR ')
    url = URI("https://newsapi.org/v2/everything?q=#{URI.encode_www_form_component(query)}&apiKey=#{api_key}&language=en&sortBy=publishedAt&pageSize=20")
    
    begin
      response = Net::HTTP.get_response(url)
      if response.is_a?(Net::HTTPSuccess)
        data = JSON.parse(response.body)
        render json: data
      else
        render json: { error: "Failed to fetch news", details: response.body }, status: :bad_gateway
      end
    rescue => e
      render json: { error: "Error fetching news: #{e.message}" }, status: :internal_server_error
    end
  end
end
