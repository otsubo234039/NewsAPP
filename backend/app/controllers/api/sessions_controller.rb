module Api
  class SessionsController < ApplicationController
    def create
      user = User.find_by(name: params[:username])
      if user && user.authenticate(params[:password])
        session[:user_id] = user.id
        render json: { user: { id: user.id, name: user.name } }
      else
        render json: { error: '認証に失敗しました' }, status: :unauthorized
      end
    end

    def destroy
      reset_session
      render json: { ok: true }
    end
  end
end
