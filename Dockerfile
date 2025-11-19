FROM node:20

RUN apt-get update && apt-get install -y 

COPY . /app

WORKDIR /app

RUN npm install

CMD ["npm", "run", "build:prod"]