FROM node:18.16

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install any needed packages specified in package.json
RUN npm install

# Copy the rest of your app's source code from your host to your image filesystem.
COPY . .

# Transpile TypeScript to JavaScript (if needed)
RUN npm run build

# Make port 3000 available to the world outside this container
EXPOSE 3000

# Copy the entrypoint script
COPY entrypoint.sh .

# Make the entrypoint script executable
RUN chmod +x entrypoint.sh

# Set the entrypoint script to run when the container starts
ENTRYPOINT ["./entrypoint.sh"]