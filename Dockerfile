FROM node:lts-jessie

# Install PM2
RUN npm install -g pm2

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

# For production:
RUN npm install --only=production

# Bundle app source
COPY . .

EXPOSE 9001

USER node

CMD [ "pm2-runtime", "npm", "--", "start" ]