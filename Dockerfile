FROM node:20-alpine

# Install Python3, G++, and Make for the local execution engine
RUN apk add --no-cache python3 g++ make

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./
# Copy workspace package files
COPY server/package.json ./server/
COPY shared/package.json ./shared/
COPY client/package.json ./client/

# Install dependencies (ignoring scripts during install if they try to build early)
RUN npm ci --ignore-scripts

# Copy the rest of the workspace
COPY shared ./shared
COPY server ./server
# We do not copy the full `client` directory to keep the image small,
# Vercel will handle the client deployment.

# Build shared types (if any) and server
RUN npm --prefix server run build

# Generate Prisma client (Important for Postgres connection)
RUN cd server && npx prisma generate --schema=./prisma/schema.prisma

# Set the working directory to the server so `npm start` runs correctly
WORKDIR /app/server

EXPOSE 4000

# We don't use 'npm run dev' in production. We use 'node dist/index.js'
CMD ["npm", "run", "start"]
