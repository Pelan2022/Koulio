# Použij oficiální nginx image
FROM nginx:alpine

# Zkopíruj všechny HTML soubory do nginx html složky
COPY koulio_complete_app.html /usr/share/nginx/html/koulio_complete_app.html
COPY login.html /usr/share/nginx/html/login.html
COPY register.html /usr/share/nginx/html/register.html
COPY profile.html /usr/share/nginx/html/profile.html
COPY index.html /usr/share/nginx/html/index.html

# Zkopíruj obrázky pokud existují
COPY vanocni_koule.jpg /usr/share/nginx/html/vanocni_koule.jpg

# Zkopíruj favicon soubory
COPY favicon.ico /usr/share/nginx/html/favicon.ico
COPY favicon-16x16.png /usr/share/nginx/html/favicon-16x16.png
COPY favicon-32x32.png /usr/share/nginx/html/favicon-32x32.png
COPY apple-touch-icon.png /usr/share/nginx/html/apple-touch-icon.png
COPY android-chrome-192x192.png /usr/share/nginx/html/android-chrome-192x192.png
COPY android-chrome-256x256.png /usr/share/nginx/html/android-chrome-256x256.png
COPY android-chrome-512x512.png /usr/share/nginx/html/android-chrome-512x512.png
COPY maskable-icon-512x512.png /usr/share/nginx/html/maskable-icon-512x512.png
COPY mstile-150x150.png /usr/share/nginx/html/mstile-150x150.png

# Zkopíruj manifest soubory
COPY manifest.webmanifest /usr/share/nginx/html/manifest.webmanifest
COPY site.webmanifest /usr/share/nginx/html/site.webmanifest

# Vytvoř nginx konfiguraci pro SPA s autentifikací
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
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|webmanifest)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
    \
    # Specifické routy pro autentifikaci \
    location /login { \
        try_files /login.html =404; \
    } \
    \
    location /register { \
        try_files /register.html =404; \
    } \
    \
    location /profile { \
        try_files /profile.html =404; \
    } \
    \
    location /app { \
        try_files /koulio_complete_app.html =404; \
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
