# Build Writebook from writebook.zip (no private registry)
ARG RUBY_VERSION=3.3.5
FROM ruby:${RUBY_VERSION}-slim AS base
WORKDIR /rails

# OS deps for building gems & assets
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
        build-essential git libvips pkg-config libsqlite3-0 unzip

# ── 1️⃣ Unpack the source zip ────────────────────────────────────────────────
ADD writebook.zip /tmp/source.zip
RUN unzip /tmp/source.zip -d /rails && rm /tmp/source.zip

# ── 2️⃣ (optional) layer your overrides ─────────────────────────────────────
# COPY patches/ /rails             # ← uncomment if you add overrides

# ── 3️⃣ Install gems ────────────────────────────────────────────────────────
RUN bundle install --without development test && \
    rm -rf ~/.bundle /usr/local/bundle/ruby/*/cache

# ── 4️⃣ Precompile assets ───────────────────────────────────────────────────
ARG SECRET_KEY_BASE
RUN SECRET_KEY_BASE=${SECRET_KEY_BASE:-dummy} \
    bundle exec rails assets:precompile

# ── 5️⃣ Slim runtime image with non-root user ───────────────────────────────
RUN groupadd -r rails --gid 1000 && \
    useradd rails --uid 1000 -g rails --create-home
USER 1000:1000
ENV RAILS_ENV=production \
    BUNDLE_DEPLOYMENT=1 \
    BUNDLE_WITHOUT=development:test

EXPOSE 80 443
CMD ["bin/boot"]
