#!/bin/bash

# ways to run this:
#
# to setup a new application (it will prompt for input):
#    $ spinnify setup [app name]
# e.g.
#    $ spinnify setup demo.com
#
# to flip the production spin to the latest code:
#    $ spinnify flip [app name]
# e.g.
#    $ spinnify flip demo.com

# you will probably want to configure these things:
SPIN_DEPLOY_FOLDER=/tmp/spins
LOG_FOLDER=/tmp/spins
NGINX_FOLDER=/usr/local/etc/nginx/sites-enabled
RESERVED_NUMBER_JSON=/Users/saibotsivad/Development/thinking/reserved-number.json
MINIMUM_PORT=4000
MAXIMUM_PORT=6000
CONFIG_PREFIX="spinnify"

# ----- you probably don't need to configure anything past here -----

# utility function to handle errors by exiting forcefully
function verify() {
	if [[ $1 -ne 0 ]]; then
		echo $2
		exit 1
	fi
}

# input properties
COMMAND=$1
APP_NAME=$2

echo "spinnify $COMMAND for $APP_NAME"

# determine which spin to use
DEPLOYED_SPIN=`npm config get $CONFIG_PREFIX-$APP_NAME:spin`
if [ "$DEPLOYED_SPIN" == "fermion" ]; then
	APP_SPIN="boson"
elif [ "$DEPLOYED_SPIN" == "boson" ]; then
	APP_SPIN="fermion"
else
	APP_SPIN="fermion"
fi

# some shortcuts to make things easier to read
NPM_CONFIG=$CONFIG_PREFIX-$APP_NAME
RESERVED="reserved-number --minimum=$MINIMUM_PORT --maximum=$MAXIMUM_PORT --settings=$RESERVED_NUMBER_JSON"
DEPLOY_NAME=$APP_NAME-$APP_SPIN

# stateful properties are stored in the npm config
if [ "$COMMAND" == "setup" ]; then
	echo "setup!"
	read -p "url used for the command 'git clone \${url}': " GIT_URL
	read -p "git branch used for deployment: " GIT_BRANCH
	read -p "domain application should be available under: " APP_DOMAIN
	read -p "path and filename for configuration file: " APP_CONFIG
	npm config set $CONFIG_PREFIX-$APP_NAME:giturl $GIT_URL
	npm config set $CONFIG_PREFIX-$APP_NAME:branch $GIT_BRANCH
	npm config set $CONFIG_PREFIX-$APP_NAME:domain $APP_DOMAIN
	npm config set $CONFIG_PREFIX-$APP_NAME:config $APP_CONFIG
	echo "application is configured, congrats!"
	exit 0
elif [ "$COMMAND" == "unflip" ]; then
	if [ "$DEPLOYED_SPIN" == "fermion" ]; then
		ROLLBACK_SPIN="boson"
	else
		ROLLBACK_SPIN="fermion"
	fi
	# copy out the backup conf file
	cp -f $SPIN_DEPLOY_FOLDER/$APP_NAME-$DEPLOYED_SPIN/.nginx-backup.conf $NGINX_FOLDER/$APP_NAME.conf
	sudo nginx -t
	verify $? "NGINX CONF FILE IS INVALID! See the file at: $NGINX_FOLDER/$APP_NAME.conf"
	sudo nginx -s reload
	# then save the prod spin
	npm config set $CONFIG_PREFIX-$APP_NAME:spin $ROLLBACK_SPIN
	echo "unflipped to previous spin: $ROLLBACK_SPIN"
	exit 0
elif [ "$COMMAND" != "flip" ]; then
	echo "command not recognized"
	echo "use in one of these ways:"
	echo "  spinnify setup [app name]"
	echo "  spinnify flip [app name]"
	echo "  spinnify unflip [app name]"
	exit 1
fi

# load the application git properties
GIT_BRANCH=`npm config get $NPM_CONFIG:branch`
GIT_URL=`npm config get $NPM_CONFIG:giturl`
APP_DOMAIN=`npm config get $NPM_CONFIG:domain`
APP_CONFIG=`npm config get $NPM_CONFIG:config`
if [ "$GIT_BRANCH" == "undefined" -o "$GIT_URL" == "undefined" -o "$APP_DOMAIN" == "undefined" -o "$APP_CONFIG" == "undefined" ]; then
	echo "could not locate configuration, was this application set up yet?"
	exit 1
fi

# shut down old spin (psy exits OK even if app didn't exist)
echo "shutting down $DEPLOY_NAME"
psy stop "$DEPLOY_NAME"
psy rm "$DEPLOY_NAME"

# deallocate the port
$RESERVED deallocate $DEPLOY_NAME

# for the cleanest environment we blow away the old code
pushd $SPIN_DEPLOY_FOLDER
rm -rf $DEPLOY_NAME

# then we grab the latest with the fastest git clone possible
git clone --depth 1 --single-branch -b $GIT_BRANCH $GIT_URL $DEPLOY_NAME
verify $? "failure downloading from git url $GIT_URL for branch $GIT_BRANCH"

# prep and test the code
pushd $DEPLOY_NAME
npm install
verify $? "failure running npm install"
npm test
verify $? "failure running tests"
npm run build
verify $? "failure running build"

# reserve a port
APP_PORT=`$RESERVED allocate $DEPLOY_NAME`
verify $? "failure allocating port"

# start the application
psy start -n "$DEPLOY_NAME" --logfile=$SPIN_DEPLOY_FOLDER/$DEPLOY_NAME.log --env.PORT=$APP_PORT --env.CONFIG=$APP_CONFIG -- npm run start
verify $? "failure starting application"

# the question of when an application is actually "running" is actually
# technically difficult, so we defer that to each application

# the assigned port is added as an environment variable, so that you
# can access it in your script like:
#    "scripts": {
#        "isup": "node myapp.js $PORT"
#    }
# or in your JS code like:
#    console.log(process.env.PORT)
#
export PORT=$APP_PORT
export CONFIG=$APP_CONFIG
npm run isup
verify $?

# --------------
# TODO: this stuff with nginx is much more expiremental

# before we copy out a new nginx conf, lets assert the existing ones are okay
sudo nginx -t
verify $? "existing nginx config files fail!"

# backup the old nginx config
cp -f $NGINX_FOLDER/$APP_NAME.conf $SPIN_DEPLOY_FOLDER/$DEPLOY_NAME/.nginx-backup.conf

# applications need to generate an nginx config based on the $PORT
export DOMAIN=$APP_DOMAIN
npm run nginx
verify $? "failed to generate an nginx config file"

# deploy the generated nginx config file
cp -f $SPIN_DEPLOY_FOLDER/$DEPLOY_NAME/.nginx-built.conf $NGINX_FOLDER/$APP_NAME.conf

# assert the nginx file works
sudo nginx -t
verify $? "generated nginx config file fails!"

# then reload nginx
sudo nginx -s reload
verify $? "reloading nginx has failed!"

# done with the nginx stuff
# ---------------

# finally, record which spin is on prod
npm config set $CONFIG_PREFIX-$APP_NAME:spin $APP_SPIN
echo "DONE! $APP_NAME has been deployed as $APP_SPIN"

# and that's about it! just need to return to the starting folder
popd
popd
