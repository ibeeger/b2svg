# Static build; the app is entirely client-side, so the runtime image is just nginx.
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Correct MIME type for .wasm so instantiateStreaming works instead of falling back.
RUN printf 'types { application/wasm wasm; }\n' > /etc/nginx/conf.d/wasm.conf
EXPOSE 80
