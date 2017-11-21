FROM nginx:1.13.6-alpine

ADD ./django.conf /etc/nginx/conf.d/default.conf

CMD ["nginx-debug", "-g", "daemon off;"]
