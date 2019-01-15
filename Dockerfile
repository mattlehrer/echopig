FROM node:lts-jessie

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

# For production:
# RUN npm install --only=production
RUN npm install

# Bundle app source
COPY . .

EXPOSE 9001

USER node

CMD [ "npm", "start" ]