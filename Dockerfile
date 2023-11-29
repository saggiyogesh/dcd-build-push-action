FROM node:alpine

WORKDIR /app

ADD . /app

RUN ls && pwd
ENTRYPOINT npm start