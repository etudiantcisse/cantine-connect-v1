FROM node:20-bookworm-slim

WORKDIR /app

# Copy only manifests first to leverage Docker layer cache for dependencies.
COPY package*.json ./
RUN npm ci

# Copy the source after dependencies are installed.
COPY . .

EXPOSE 8081 19000 19001 19002

CMD ["npm", "run", "start:docker"]
