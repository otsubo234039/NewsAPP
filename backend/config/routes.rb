Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # simple root for healthcheck and frontend
  root to: 'home#index'
  # RSS / feeds endpoint
  get 'api/articles', to: 'feeds#index'
  get 'api/ping', to: 'feeds#ping'
  namespace :api do
    resources :users, only: [:create]
    resource :sessions, only: [:create, :destroy]
    resources :tags, only: [:index]
  end
  # OmniAuth routes (Google)
  # OAuth start (redirects to provider) and callback endpoints
  get '/auth/google_oauth2', to: 'api/omniauth_callbacks#start'
  get '/auth/:provider/callback', to: 'api/omniauth_callbacks#callback'
  get '/auth/failure', to: 'api/omniauth_callbacks#failure'
  namespace :api do
    resources :user_categories, only: [:create]
  end
end
