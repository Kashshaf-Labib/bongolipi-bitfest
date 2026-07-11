FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY . .

# Host platforms (e.g. Hugging Face Spaces) route to $PORT; default to 1234.
ENV PORT=1234
EXPOSE 1234

CMD ["node", "index.js"]
