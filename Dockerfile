FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
WORKDIR /app
COPY . .
ARG VITE_BASE44_APP_ID=698c54d09e4046a82210a18e
ARG VITE_BASE44_APP_BASE_URL=https://base44.app
ARG VITE_ENABLE_LOCAL_ADMIN_LOGIN=false
ARG VITE_LOCAL_ADMIN_PASSWORD=
ENV VITE_BASE44_APP_ID=${VITE_BASE44_APP_ID}
ENV VITE_BASE44_APP_BASE_URL=${VITE_BASE44_APP_BASE_URL}
ENV VITE_ENABLE_LOCAL_ADMIN_LOGIN=${VITE_ENABLE_LOCAL_ADMIN_LOGIN}
ENV VITE_LOCAL_ADMIN_PASSWORD=${VITE_LOCAL_ADMIN_PASSWORD}
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/server.js ./server.js
EXPOSE 8080
CMD ["npm", "start"]
