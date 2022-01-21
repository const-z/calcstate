FROM node:14-alpine

WORKDIR /app/web

RUN apk add --no-cache python2 make g++

COPY ./package.json ./

RUN  npm install

EXPOSE 8080