# ────────────────────────────────────────────────────────────────
# Build Writebook from writebook.zip (no private registry calls)
# ────────────────────────────────────────────────────────────────

# ------------ 1️⃣  Base image
ARG RUBY_VERSION=3.3.5
FROM ruby:${RUBY_VERSION}-slim AS base
WORKDIR /rails

# common OS deps
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
      build-essential git libvips curl unzip pkg-config libsqlite3-0

# ------------ 2️⃣  Build stage
FROM base AS build

# 2.1  Copy & unpack the source archive
ADD writebook.zip /tmp/source.zip
RUN unzip /tmp/source.zip -d /rails && rm /tmp/source.zip

# 2.2  Install gems
COPY Gemfile Gemfile.lock .ruby-version /rails/
RUN bundle install --without development test \
    && rm -rf ~/.bundle /usr/local/bundle/ruby/*/cache

# 2.3  Add any overrides (optional: delete if not used)
COPY patches/ /rails

# 2.4  Pre-compile assets (needs a throw-away secret)
ARG SECRET_KEY_BASE
RUN SECRET_KEY_BASE=${SECRET_KEY_BASE:-dummy} \
    bundle exec rails assets:precompile

# ------------ 3️⃣  Runtime stage (small)
FROM base

# copy Ruby gems + compiled app from build stage
COPY --from=build /usr/local/bundle /usr/local/bundle
COPY --from=build /rails /rails

# drop root, run as rails user
RUN groupadd -r rails --gid 1000 && \
    useradd rails --uid 1000 -g rails --create-home
USER 1000:1000
WORKDIR /rails

ENV RAILS_ENV=production \
    BUNDLE_DEPLOYMENT=1 \
    BUNDLE_WITHOUT=development:test

EXPOSE 80 443
CMD ["bin/boot"]
