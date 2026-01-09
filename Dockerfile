# Build stage - compile Tailwind CSS
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN npm install

COPY tailwind.config.js ./
COPY css/src/ ./css/src/
COPY *.html ./
COPY js/ ./js/

RUN npm run build:css

# Production stage
FROM nginx:1.29-alpine

COPY index.html /usr/share/nginx/html/index.html
COPY impressum.html /usr/share/nginx/html/impressum.html
COPY cidr-calculator.html /usr/share/nginx/html/cidr-calculator.html
COPY timestamp-converter.html /usr/share/nginx/html/timestamp-converter.html
COPY uuid-generator.html /usr/share/nginx/html/uuid-generator.html
COPY cron-tester.html /usr/share/nginx/html/cron-tester.html
COPY yaml-formatter.html /usr/share/nginx/html/yaml-formatter.html
COPY --from=builder /app/css/style.css /usr/share/nginx/html/css/style.css
COPY js/ /usr/share/nginx/html/js/
COPY images/ /usr/share/nginx/html/images/

RUN chmod -R 755 /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
