module Api
  class OmniauthCallbacksController < ActionController::API
    # Callback endpoint for /auth/:provider/callback
    # Start endpoint for /auth/google_oauth2 -> redirects to Google consent screen
    def start
      client_id = ENV['GOOGLE_CLIENT_ID']
      redirect_uri = ENV.fetch('GOOGLE_REDIRECT_URI', 'http://localhost:3001/auth/google_oauth2/callback')
      scope = 'openid email profile'
      auth_url = "https://accounts.google.com/o/oauth2/v2/auth?client_id=#{CGI.escape(client_id.to_s)}&redirect_uri=#{CGI.escape(redirect_uri)}&response_type=code&scope=#{CGI.escape(scope)}&access_type=offline&prompt=consent"
      redirect_to auth_url, allow_other_host: true
    end

    def callback
      # Support two flows:
      # 1) Manual code exchange: Google redirects back with `code` param -> exchange for token and fetch userinfo
      # 2) OmniAuth env (when middleware handles it) -> use request.env['omniauth.auth']
      if params[:code].present?
        # Exchange authorization code for tokens and fetch userinfo
        client = OAuth2::Client.new(ENV['GOOGLE_CLIENT_ID'], ENV['GOOGLE_CLIENT_SECRET'], site: 'https://oauth2.googleapis.com', token_url: '/token')
        token = client.auth_code.get_token(params[:code], redirect_uri: ENV.fetch('GOOGLE_REDIRECT_URI', 'http://localhost:3001/auth/google_oauth2/callback'))
        resp = token.get('https://www.googleapis.com/oauth2/v3/userinfo')
        info = JSON.parse(resp.body)
        provider = 'google'
        uid = info['sub']
        email = info['email']
        name = info['name'] || info['email']&.split('@')&.first
      else
        auth = request.env['omniauth.auth']
        provider = params[:provider]
        uid = auth['uid']
        info = auth['info'] || {}
        email = info['email']
        name = info['name'] || info['nickname'] || email&.split('@')&.first
      end

      user = User.find_by(provider: provider, uid: uid)
      unless user
        user = User.new(
          provider: provider,
          uid: uid,
          email: email || "",
          name: name || "",
          password: SecureRandom.hex(16) # set a random password for has_secure_password
        )
        user.save!(validate: false)
      end

      # If the request comes from a browser (HTML accept), redirect back to frontend with the user id
      frontend_url = ENV.fetch('FRONTEND_URL', 'http://localhost:3000')
      if request.headers['HTTP_ACCEPT']&.include?('text/html') || request.format.to_s == 'text/html'
        redirect_to "#{frontend_url}/setup?oauth_user_id=#{user.id}&provider=#{CGI.escape(provider.to_s)}", allow_other_host: true
      else
        render json: { user: { id: user.id, name: user.name, email: user.email, provider: user.provider, uid: user.uid } }
      end
    rescue => e
      Rails.logger.error("OmniAuth callback error: #{e.message}\n#{e.backtrace.join("\n")}")
      render json: { error: 'Authentication failed' }, status: :unauthorized
    end

    def failure
      render json: { error: 'Authentication cancelled or failed' }, status: :unauthorized
    end
  end
end
