FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN npm run build
EXPOSE 9999
CMD ["npm", "start"]
