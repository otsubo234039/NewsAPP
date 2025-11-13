FROM node:18-alpine
WORKDIR /usr/src/app

# copy package files and install dependencies
COPY package.json ./
RUN npm install --production

# copy app sources
COPY . ./

EXPOSE 3000
CMD ["npm", "start"]
