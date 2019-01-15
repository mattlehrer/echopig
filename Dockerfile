FROM node:10.15.0

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

# If you are building your code for production
# RUN npm install --only=production
RUN npm install

# Bundle app source
COPY . .

EXPOSE 9001

USER node

CMD [ "npm", "start" ]