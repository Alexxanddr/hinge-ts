FROM node:22.23.4-alpine

WORKDIR /app

RUN npm init -y
RUN npm install hinge-ts ws

COPY examples/node-http/server.mjs ./server.mjs

ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.mjs"]
