FROM nginx:alpine

ADD front/public /usr/share/nginx/html
ADD image/static/react-router.conf /etc/nginx/conf.d/react-router.conf
RUN rm /etc/nginx/conf.d/default.conf
