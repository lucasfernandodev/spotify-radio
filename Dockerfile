FROM node:17-slim

RUN apt-get update \
  && apt-get install sox libsox-fmt-mp3 -y

RUN npm install -g npm@8.5.5

WORKDIR /spotify-radio/


COPY package.json package-lock.json /spotify-radio/

RUN npm ci --silent

COPY . .

USER node


CMD npm run live-reload