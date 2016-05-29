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
MAXIMUM_PORT=4002
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

# stateful properties are stored in the npm config
if [ "$COMMAND" == "setup" ]; then
	echo "setup!"
	read -p "url used for the command 'git clone \${url}': " GIT_URL
	read -p "git branch used for deployment: " GIT_BRANCH
	npm config set $CONFIG_PREFIX-$APP_NAME:giturl $GIT_URL
	npm config set $CONFIG_PREFIX-$APP_NAME:branch $GIT_BRANCH
	echo "application is configured, congrats!"
	exit 0
elif [ "$COMMAND" != "flip" ]; then
	echo "command not recognized"
	echo "use in one of these ways:"
	echo "  spinnify setup [app name]"
	echo "  spinnify flip [app name]"
	exit 1
fi

# some shortcuts to make things easier to read
NPM_CONFIG=$CONFIG_PREFIX-$APP_NAME
RESERVED="reserved-number --minimum=$MINIMUM_PORT --maximum=$MAXIMUM_PORT --settings=$RESERVED_NUMBER_JSON"

# load the application git properties
GIT_BRANCH=`npm config get $NPM_CONFIG:branch`
GIT_URL=`npm config get $NPM_CONFIG:giturl`
if [ "$GIT_BRANCH" == "undefined" -o "$GIT_URL" == "undefined" ]; then
	echo "could not locate configuration, was this application set up yet?"
	exit 1
fi

# figure out which spin to use
DEPLOYED_SPIN=`npm config get $CONFIG_PREFIX-$APP_NAME:spin`
if [ "$DEPLOYED_SPIN" == "fermion" ]; then
	echo "currently deployed is: fermion"
	echo "restarting: boson"
	APP_SPIN="boson"
elif [ "$DEPLOYED_SPIN" == "boson" ]; then
	echo "currently deployed is: boson"
	echo "restarting: fermion"
	APP_SPIN="fermion"
else
	echo "no spin currently deployed"
	echo "starting: fermion"
	APP_SPIN="fermion"
fi

# another shortcut for easier reading
DEPLOY_NAME=$APP_NAME-$APP_SPIN

# shut down old spin
if [ $DEPLOYED_SPIN != "undefined" ]; then
	echo "shutting down $APP_NAME@$APP_SPIN"
	psy kill "$DEPLOY_NAME"
fi

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
psy start -n "$DEPLOY_NAME" --logfile=$SPIN_DEPLOY_FOLDER/$DEPLOY_NAME.log --env.PORT=$APP_PORT -- npm run start
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
npm run isup
verify $?

# --------------
# TODO: this stuff with nginx is much more expiremental

# before we copy out a new nginx conf, lets assert the existing ones are okay
nginx -t
verify $? "existing nginx config files fail!"

# backup the old nginx config
cp -f NGINX_FOLDER/$APP_NAME.conf $SPIN_DEPLOY_FOLDER/$DEPLOY_NAME/.$CONFIG_PREFIX-backup.conf

# applications need to generate an nginx config based on the $PORT
npm run nginx
verify $? "failed to generate an nginx config file"

# deploy the generated nginx config file
cp -f $SPIN_DEPLOY_FOLDER/$DEPLOY_NAME/.nginx.conf NGINX_FOLDER/$APP_NAME.conf

# assert the nginx file works
nginx -t
verify $? "generated nginx config file fails!"

# then reload nginx
nginx -s reload
verify $? "reloading nginx has failed!"

# done with the nginx stuff
# ---------------

# and that's about it!

# just need to return to starting folder
popd
popd
