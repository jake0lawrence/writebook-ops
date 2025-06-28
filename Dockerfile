# ./Dockerfile  — build your patched Writebook image
FROM registry.once.com/writebook:latest

# ---- customizations ---------------------------------------------------------
# Copy persistent CSS, GA snippet, etc.
COPY ./patches/ /opt/writebook/patches/
#   └─ app/assets/stylesheets/custom.css
#   └─ app/views/layouts/application.html.erb  (with GA snippet)

# Precompile assets (optional—speeds up first boot)
RUN cd /opt/writebook \
    && bundle exec rails assets:precompile

# Provide build-time GA_ID (deploy.yml already sets it)
ARG GA_ID
ENV GA_ID=${GA_ID}
