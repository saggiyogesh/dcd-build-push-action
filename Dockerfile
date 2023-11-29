FROM node:alpine

WORKDIR /app

ADD . /app

ENTRYPOINT npm start