# syntax=docker/dockerfile:1
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .
ENV PORT=4000
# ENV DATABASE_PATH=/app/data/app.db
EXPOSE 4000

CMD ["npm", "run", "start"]
