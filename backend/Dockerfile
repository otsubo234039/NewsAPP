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

# Ensure executable permissions
RUN chmod +x bin/rails bin/rake

EXPOSE 3000
# Wait for DB TCP port, run migrations, ensure no stale PID, then start server
CMD ["sh", "-c", "bundle install || true && until (echo > /dev/tcp/${DATABASE_HOST:-db}/${DATABASE_PORT:-5432}) >/dev/null 2>&1; do echo 'waiting for db'; sleep 1; done && bundle exec rails db:create db:migrate || true && rm -f tmp/pids/server.pid && bundle exec rails server -b 0.0.0.0 -p 3000"]
