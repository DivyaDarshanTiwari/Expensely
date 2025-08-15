FROM node:24-alpine3.21

WORKDIR /group-service

COPY . .

RUN npm install

EXPOSE 8084

CMD ["npm" , "start"]