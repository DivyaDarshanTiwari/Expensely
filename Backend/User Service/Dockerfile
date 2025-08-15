FROM node:24-alpine3.21

WORKDIR /user-service

COPY . .

RUN npm install


EXPOSE 8083

EXPOSE 5000

CMD ["npm" , "start"]