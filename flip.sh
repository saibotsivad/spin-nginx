#!/bin/bash

# NGINX_SSH_SERVER=username@site.com
# NGINX_SSH_SERVER=username@1.2.3.4

APP_NAME=$1

COMMAND="/root/spin-nginx/spinnify flip $APP_NAME"

ssh $NGINX_SSH_SERVER $COMMAND
