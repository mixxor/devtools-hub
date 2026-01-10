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

# Generate sitemap
COPY generate-sitemap.sh ./
RUN chmod +x generate-sitemap.sh && ./generate-sitemap.sh

# Production stage
FROM nginx:1.29-alpine

COPY index.html /usr/share/nginx/html/index.html
COPY impressum.html /usr/share/nginx/html/impressum.html
COPY cidr-calculator.html /usr/share/nginx/html/cidr-calculator.html
COPY timestamp-converter.html /usr/share/nginx/html/timestamp-converter.html
COPY uuid-generator.html /usr/share/nginx/html/uuid-generator.html
COPY cron-tester.html /usr/share/nginx/html/cron-tester.html
COPY yaml-formatter.html /usr/share/nginx/html/yaml-formatter.html
COPY password-generator.html /usr/share/nginx/html/password-generator.html
COPY password-checker.html /usr/share/nginx/html/password-checker.html
COPY --from=builder /app/css/style.css /usr/share/nginx/html/css/style.css
COPY --from=builder /app/sitemap.xml /usr/share/nginx/html/sitemap.xml
COPY js/ /usr/share/nginx/html/js/
COPY images/ /usr/share/nginx/html/images/
COPY data/ /usr/share/nginx/html/data/

RUN chmod -R 755 /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
