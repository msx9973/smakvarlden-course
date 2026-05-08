FROM node:22-alpine

WORKDIR /app

# Copy pre-built API server bundle (includes all dependencies bundled by esbuild)
COPY artifacts/api-server/dist/ ./

# Copy pre-built frontend static files
COPY artifacts/smakvarlden/dist/public/ ./public/

ENV NODE_ENV=production
ENV STATIC_DIR=/app/public

EXPOSE 3000

CMD ["node", "--enable-source-maps", "index.mjs"]
