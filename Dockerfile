FROM node:alpine

COPY dist exec /
ADD . /app

ENTRYPOINT ["node", "dist/index.js"]