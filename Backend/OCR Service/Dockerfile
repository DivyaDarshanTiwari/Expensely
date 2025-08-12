FROM node:24-alpine3.21

WORKDIR /ocr-service

COPY . .

RUN npm install

EXPOSE 8082
EXPOSE 5000

CMD ["npm" , "start"]