# Stage 1: Build the React SPA
FROM node:24-alpine AS build

WORKDIR /app

# Copy dependency definitions and lockfile
COPY package*.json ./

# Install dependencies cleanly
RUN npm ci

# Copy the rest of the application source code
COPY . .

# Generate PWA asset icons from favicon.svg
RUN node scratch/generate_pwa_icons.cjs

# Build the production application
RUN npm run build

# Stage 2: Serve the static files with Nginx
FROM nginx:alpine

# Copy built assets from build stage to nginx html directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx config for SPA routing and security headers
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
