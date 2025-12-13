Rails.application.config.middleware.use OmniAuth::Builder do
  # Configure Google if credentials present
  if ENV['GOOGLE_CLIENT_ID'].present? && ENV['GOOGLE_CLIENT_SECRET'].present?
    provider :google_oauth2, ENV['GOOGLE_CLIENT_ID'], ENV['GOOGLE_CLIENT_SECRET'], {
      access_type: 'offline',
      prompt: 'consent'
    }
  end

  # Configure GitHub if credentials present
  if ENV['GITHUB_CLIENT_ID'].present? && ENV['GITHUB_CLIENT_SECRET'].present?
    provider :github, ENV['GITHUB_CLIENT_ID'], ENV['GITHUB_CLIENT_SECRET'], scope: 'user:email'
  end

  # Configure Apple (optional) — requires additional Apple key setup
  if ENV['APPLE_CLIENT_ID'].present? && ENV['APPLE_TEAM_ID'].present? && ENV['APPLE_KEY_ID'].present? && ENV['APPLE_PRIVATE_KEY'].present?
    provider :apple, ENV['APPLE_CLIENT_ID'], '', {
      team_id: ENV['APPLE_TEAM_ID'],
      key_id: ENV['APPLE_KEY_ID'],
      pem: ENV['APPLE_PRIVATE_KEY'],
      scope: 'name email'
    }
  end
end

# Optional: handle OmniAuth logger verbosity in production
OmniAuth.config.logger = Rails.logger
