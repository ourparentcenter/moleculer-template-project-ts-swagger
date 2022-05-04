FROM node:lts-alpine

# Working directory
WORKDIR /app

# Install dependencies npm
COPY package.json package-lock.json ./

# Install dependencies yarn
# COPY package.json yarn.lock ./

# Add moleculer
RUN npm install -g moleculer-cli
# RUN yarn global add moleculer-cli

# Add all supported transporters except kafka
RUN npm install -g amqp \
	nats \
	node-nats-streaming \
	ioredis \
	mqtt \
	amqplib \
	rhea-promise

# RUN yarn global add install amqp \
# 	nats \
# 	node-nats-streaming \
# 	ioredis \
# 	mqtt \
# 	amqplib \
# 	rhea-promise

# Add all supported serializers
RUN npm install -g avsc \
	msgpack5 \
	notepack.io \
	protobufjs \
	thrift

# RUN yarn global add avsc \
# 	msgpack5 \
# 	notepack.io \
# 	protobufjs \
# 	thrift

# install project dependencies
RUN npm ci --silent
# RUN yarn install --frozen-lockfile

# Copy source
COPY . .

# Build and cleanup
ENV NODE_ENV=production

# build
RUN npm run build \
	&& npm prune

# RUN yarn run build

# Start server
CMD ["npm", "run", "start"]
# CMD ["yarn", "run", "start"]
