FROM docker:29-cli AS docker-cli
FROM n8nio/n8n
USER root
COPY --from=docker-cli /usr/local/bin/docker /usr/local/bin/docker
RUN chmod +x /usr/local/bin/docker
USER node
