FROM node:15

# Create app directory
WORKDIR /usr/src/app

VOLUME [ "/usr/src/app/data" ]

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
COPY src/postinstall.js ./src/postinstall.js
COPY src/config.default.json ./src/config.default.json

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

CMD [ "sh", "-c", "node src/server.js" ]
