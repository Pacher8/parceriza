#!/bin/sh
set -e
# Substitui apenas $PORT — deixa variáveis nginx ($uri, $host, etc.) intactas
envsubst '$PORT' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf
exec nginx -g "daemon off;"
