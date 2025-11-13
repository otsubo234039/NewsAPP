FROM ruby:3.2-slim
WORKDIR /usr/src/app

# Install runtime/build deps
RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends build-essential libpq-dev libyaml-dev nodejs curl && \
    rm -rf /var/lib/apt/lists/*

# Use Gemfile from host (rails generator already created it)
COPY Gemfile Gemfile.lock* ./

RUN gem install bundler && bundle config set --local path 'vendor/bundle' && bundle install

COPY . ./

EXPOSE 3000
CMD ["bash", "-lc", "bundle install || true; bin/rails db:create db:migrate || true; bin/rails server -b 0.0.0.0 -p 3000"]
