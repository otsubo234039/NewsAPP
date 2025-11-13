class HomeController < ApplicationController
  def index
    render json: { status: 'ok', message: 'Rails API running' }
  end
end
