# Použij oficiální nginx image
FROM nginx:alpine

# Zkopíruj HTML soubor do nginx html složky
COPY koulio_complete_app.html /usr/share/nginx/html/index.html

# Zkopíruj obrázek pokud existuje
COPY vanocni_koule.jpg /usr/share/nginx/html/vanocni_koule.jpg

# Vytvoř nginx konfiguraci pro SPA
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    # Povol gzip kompresi \
    gzip on; \
    gzip_vary on; \
    gzip_min_length 1024; \
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json; \
    \
    # Cache pro statické soubory \
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
    \
    # Fallback pro SPA routing \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Exponuj port 80
EXPOSE 80

# Spusť nginx
CMD ["nginx", "-g", "daemon off;"]
