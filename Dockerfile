FROM node

# Install PM2
RUN npm install -g pm2

# Install puppeteer dependencies
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
  && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
  && apt-get update \
  && apt-get install -y google-chrome-unstable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst ttf-freefont \
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

# For production:
RUN npm install --only=production

# Setup node user to run puppeteer
RUN usermod -a -G audio,video node

# Bundle app source
COPY . .

EXPOSE 9001

USER node

CMD [ "pm2-runtime", "start", "./data/pm2/ecosystem.config.js" ]