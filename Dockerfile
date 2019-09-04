FROM node:12.7.0-alpine

ADD . /app
WORKDIR /app

RUN apk update && apk upgrade && apk add bash
RUN rm -rf node_modules && npm install

EXPOSE 8088

ENTRYPOINT ["npm", "run", "start"]