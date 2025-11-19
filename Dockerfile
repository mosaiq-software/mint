FROM node:20

RUN apt-get update && apt-get install -y 

COPY . /app

WORKDIR /app

CMD ["npm", "run", "build"]