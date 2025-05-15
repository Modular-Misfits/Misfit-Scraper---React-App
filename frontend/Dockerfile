FROM node:latest

# Install PostgreSQL client for database operations
# RUN apt-get update

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm i --loglevel verbose

# Copy application code
COPY . .

# Build the application (if needed)
RUN npm run build

# Default to development
ENV NODE_ENV=development
ENV PORT=8080

# Expose the application port
EXPOSE 8080

# This command is passed to the entrypoint script
CMD ["npm", "run", "dev"]