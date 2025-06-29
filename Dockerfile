# Dockerfile   (build Writebook from the zip you committed)
# ---------------------------------------------------------

ARG RUBY_VERSION=3.3.5
FROM ruby:${RUBY_VERSION}-slim AS base
WORKDIR /rails

# unzip tool
RUN apt-get update -qq && apt-get install --no-install-recommends -y unzip

# --- 1) copy the zipped source ------------------------------------------------
# writebook.zip lives in repo root after checkout
ADD writebook.zip /tmp/writebook.zip

# --- 2) unpack & clean --------------------------------------------------------
RUN unzip /tmp/writebook.zip -d /rails && rm /tmp/writebook.zip

# --- 3) reuse the upstream build script --------------------------------------
# the zip already contains the upstream Dockerfile and bin/docker-build script
ARG SECRET_KEY_BASE
RUN ./bin/docker-build

# final stage is produced inside bin/docker-build, so just set default CMD
EXPOSE 80 443
CMD ["bin/boot"]
