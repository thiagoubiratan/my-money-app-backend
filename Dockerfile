FROM node:16-slim

WORKDIR /app
COPY ./ ./
RUN yarn
CMD yarn run dev
EXPOSE 3030