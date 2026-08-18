FROM node:20-alpine

WORKDIR /app

# Install dependencies using npm
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Start the server
CMD ["npm", "run", "start"]
