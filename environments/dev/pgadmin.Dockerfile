# pgAdmin with pre-configured server
FROM dpage/pgadmin4:latest

# Copy server configuration
COPY pgadmin-servers.json /pgadmin4/servers.json

# Run in SDI mode for auto-load
ENV PGADMIN_SERVER_JSON_FILE=/pgadmin4/servers.json
