# API

The `spin-nginx` module is, in a sense, simply an ordered
set of shell commands, which you can step through and run
without needing the `spin-nginx` module at all.

However, behind the scenes `spin-nginx` maintains a `state`
which includes information such as "which ports are in use"
and "which spin is deployed", and this state is used to
determine which ports are used when starting an app.

So then, knowing how to use `spin-nginx` is simply a matter
of knowing the order the commands are run, and what state
is passed to each command.

## Passing in State

When a command is executed and some state is passed in, they
are passed in as environment variables of the form:

	--spin:NAME=VALUE

(Each command below lists the property names and values that
are passed in.)

So in your `package.json` file, a `script` property would
access those like this:

	"start": "node start.js $npm_config_spin_NAME"

For example, when `npm run start` is executed, the assigned
ports are passed in, so the command is run like this:

	npm run start --spin:ports=[4001,4002]

Then inside the `start` script, you could access that value
like this:

	"scripts": {
		"start": "node serve.js $npm_config_spin_ports"
	}

In which case you could access that value inside the `serve.js`
file like this:

	const ports = JSON.parse(process.argv[2])
	console.log(ports[1]) # => 4002

## Order of Commands

> Note: If a `npm run` script does not exit successfully, the
> deploy process is stopped. So if your application doesn't use
> one of the steps, you'll still need to define the `npm run`
> script in your `package.json`.

### 1: `npm run shutdown`

The existing spin needs to be decommisioned, so the shutdown
command is run.

State properties given:

* `ports`: The ports assigned to the running application spin.
* `spin`: The spin of the application being shut down.

### 2: `git fetch ${remote}`

The latest code is downloaded.

### 3: `git reset --hard ${remote}/${branch}`

All changes in the folder are completely blown away, and replaced
by whatever is at `HEAD` of the configured remote branch.

### 4: `npm install`

Run the install process.

*(No state properties are given here.)*

### 5: `npm run test`

Verify that all functional tests pass on the production server,
prior to starting the application.

*(No state properties are given here.)*

### 6: `npm run build`

The application is given an opportunity to generate files or run
other setup prior to starting.

State properties given:

* `ports`: The ports assigned to the application spin being deployed.
* `spin`: The spin of the application being deployed.

### 7: `npm run start`

The application is started in whatever way the user wants.

State properties given:

* `ports`: The ports assigned to the application spin being deployed.
* `spin`: The spin of the application being deployed.









### 8: `nginx -t`

Assert that the existing nginx configuration works.

### 9: `cp ${applicationNginxConf} ${nginxFolder}`

The nginx configuration file of the application is copied
out to the folder containing nginx conf files, overwriting
the existing one.

### 10: `nginx -t`
### 11: `nginx -s reload`
