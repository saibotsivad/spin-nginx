#!/bin/bash

function verify() {
	if [[ $1 -ne 0 ]]; then
		echo "startup process failed!!!"
		exit 1
	fi
}

# Example:
# spinnify myapp fermion 8081 master https://github.com/tobiaslabs/simple-crud-demo.git

APP_NAME=$1
APP_SPIN=$2
APP_PORT=$3
GIT_BRANCH=$4
GIT_URL=$5


DEPLOY_NAME=$APP_NAME-$APP_SPIN

echo "Deploying $DEPLOY_NAME on port $APP_PORT"

psy kill "$DEPLOY_NAME"

git clone --depth 1 --single-branch -b $GIT_BRANCH $GIT_URL $DEPLOY_NAME
verify $?

pushd $DEPLOY_NAME

npm install
verify $?

npm test
verify $?

npm run build
verify $?

psy start -n "$DEPLOY_NAME" --logfile=../$DEPLOY_NAME.log --env.PORT=$APP_PORT -- npm run start
verify $?

export PORT=$APP_PORT

sleep 3

npm run isup
verify $?

popd
