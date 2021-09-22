FROM node:15.0.1

WORKDIR /app

COPY ./node-server ./
COPY ./docker-config/config.js ./config

RUN npm install

CMD ["node", "server.js"]
