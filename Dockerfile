FROM node:latest
COPY . ./app
WORKDIR /app
RUN npm install && npm install -g typescript
CMD npm start