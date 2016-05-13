# spin-nginx

Easily deploy new versions of websites that run using NGINX.

The gist of it is that instead of typing a bunch of commands,
you can type `spin-nginx deploy mysite.com` and it'll deploy
the updates site with *zero-downtime*, with pre-deploy testing
built in.

## opinions

This is a mildly opinionated utility, so here's some explanation
of the opinions:

#### load balancer

Use NGINX as a middle-man proxy, kind of like a load balancer. This
means you might run several server applications on one computer,
and NGINX distributes incoming requests to those applications.

#### nginx opinions

Each application is responsible for it's own NGINX configuration.
Each site is different, and I don't know enough about NGINX to
try enforcing opinions about how to use it. 

The only enforced opinion is that each site has an individual NGINX
config file placed in one collective folder.

> Note: The default NGINX install in Ubuntu puts a folder in
> `/usr/local/etc/nginx/sites-enabled` and then the
> main NGINX config imports `*.conf` from that folder.
> This seems like a good idea.

#### apps are given the ports they should use

When you launch a web app, you'll almost always need to listen
on some port to handle requests. NGINX listens on port `80` and
hands requests to your web app over some other port.

When your app launches, it tells `spin-nginx` how many ports it
needs, and `spin-nginx` will register those ports for that app.

In this way, you can very easily deploy even hundreds of apps
on one box, and not need to worry about mapping ports to apps.

#### use [psy](https://www.npmjs.com/package/psy) to run apps

If you run a web service, you'll have to deal with the main
process possibly crashing. In those cases you will want something
which automatically restarts your service, and this project has
decided to use [psy](https://www.npmjs.com/package/psy).

However, this is an opinion I am not too confident on, so if
it can be made configurable it will be, eventually.

#### toggling between deployed versions using spins

If you have an API running and you want to deploy a new version,
in the general ideal case you don't want to shut down the existing
version prior to starting and making active the new version.

Ideally you'd want to do something like this, which gives you
true zero-downtime for deploying, and is what `spin-nginx` does:

1) start up the new API, independent of the currently deployed version
2) poke at the new API to make sure it's running
3) use the magic of NGINX to switch incoming requests to the new API
4) shut down the old API (`spin-nginx` doesn't do this step)

This approach means that, at any time during the rollout, you can
either stop or roll back very easily.

Of course, sometimes you'll need a full shutdown before deploying
a new version, like if you need to run database update scripts
prior to starting the new version. But you should really strive
to find ways to make this general flow work.

## install

Although there's an API you can interact with programmatically,
you'll probably want to install it globally:

	npm install -g spin-nginx

## settings file

When you run `spin-nginx` you'll need to pass in the path
to a JSON file which holds your personal configuration
details. Normally it looks like this:

	spin-nginx --settings=/path/to/settings.json [actions]

What you will probably want to do is add an alias so that
you don't have to do that each time. E.g. add this to your
`~/.profile` or `~/.bashrc` file:

	alias spin="spin-nginx --settings=/path/to/settings.json"

Now you can run `spin [actions]` instead, and your configuration
file will be referenced correctly.

## configure it

Run this:

	spin-nginx setup

It'll prompt you for the things you'll need to decide:

#### `minimum/maximum port number`

This is the range (inclusive) of ports that your apps can use.

E.g. if you had the range `4000` to `5000` and each app
reserved `1` port, you could run `1000` apps at the same time.

The range of ports that you reserve must *not* be used by other
apps. This isn't usually too difficult if you run all your apps
through `spin-nginx`, but if you run other apps you'll need to
be careful with that.

#### `git clone folder`

When an app is deployed, `spin-nginx` will run `git clone` to
get the latest version. You'll probably want to have a folder
like `/var/spin-nginx` or something that will hold the deployed
application files.

#### `nginx folder`

When a site is deployed, the NGINX config file gets generated
and copied out to a single folder. Each config file is given
a name based on the registered app name.

It is recommended that you make a sub-folder dedicated to
sites managed by `spin-nginx`, and make your root NGINX
config file import `*.conf` from that folder.

## register a site

You add named sites which are pointed at a git repo. Run it
like this:

	spin-nginx register [app name]

E.g.

	spin-nginx register myapp

**TODO: Pushing commits to branches is not currently supported.**

When you register a site, you'll need to give it a unique name--the
domain of the site usually works well. You'll also need to tell it
the three branches it will use.

The git repo will need a `package.json` at the root, and
`spin-nginx` will run certain commands in that folder in
a sequential order.

Here's how the three branches work (**TODO: not yet**):

1) Modify and add commits to the master branch.
2) Deploy the `fermion` spin.
3) After the spin is deployed, a commit is pushed up to the
	`fermion` branch (you can name it whatever you want) with
	the deployment details.

This means you will have two branches representing the history
of the app *as deployed*.

E.g. you can look at your repository `fermion` branch history
for deploy commits, and be able to know at what time and what
actual code was deployed.

> Note: The supported approach is that you have two branches
> dedicated only to deployment. You should not push any commits
> to those branches, they act as a deployment history record.

## deploy

Right now you have to specify which spin you want deployed. This
might change in the future.

	spin-nginx deploy [app name] [spin]

E.g.

	spin-nginx deploy myapp fermion

The deployment process follows these steps:

#### 1) shut down selected spin (uses psy)

The selected spin is shut down.

(Note: if `fermion` is deployed to production, you do **not**
want to run deploy `fermion`, because this will shut down
the production server. **TODO: should be able to add a safety check.**)

#### 2) blow away selected spin folder

The cloned repo for that spin is completely removed.

#### 3) clone the repo from `master` branch

The repo is cloned into a folder which is named based
on the registered app name and spin.

#### 4) `npm install`

#### 5) `npm test`

#### 6) `npm run build`

The `test` and `build` are always run. If you don't
have them in your `package.json` this will be a failure,
so you will need to at least add something like:

	"build": "echo \"no build\""

#### 7) start that spin (uses psy and `npm run start`)

The app is started with psy, calling `npm run start` and setting
the registered ports as environment variables. (See the [demo app][demo_app]
for an example of how this might be used.)

#### 8) make sure the server is running (`npm run isup`)

When running `isup`, the ports are passed in as an environment
variable as well. (A lot like the `npm run start` approach.)

#### 9) build the NGINX conf file (`npm run nginx`)

You will almost always want to generate an NGINX config
file for your app. The ports are passed in as environment
variables here. Check out the [demo app][demo_app] for an
example of how you can do this easily.

#### 10) backup the NGINX conf file

The existing NGINX conf file is copied into the repo folder
under the name `.rollback-${name}.conf` so that you can roll
back deployed versions very easily.

#### 11) test and reload NGINX

Finally, the commands are run: `nginx -t` which verifies that the
generated NGINX config file is valid, and `nginx -s reload` which
does the zero-downtime reload of NGINX.

# EXAMPLE

Try it out with the [demo app][demo_app] that I put together.

First run the setup:

	$ spin-nginx setup --settings=settings.json

	# Configuring new spinx setup...
	# Enter the minimum port number (default 4000): 4000
	# Enter the maximum port number (default 5000): 5000
	# Enter the folder name where `git clone` happens: /tmp
	# Enter the folder where nginx.conf files should go: /usr/local/etc/nginx/sites-enabled
	# Done!

Then register, using the demo app git url:

	$ spin-nginx register myapp --settings=settings.json

	# Registering a new site...
	# Enter the URL to the repo (used in `git clone ${url}`): https://github.com/tobiaslabs/simple-crud-demo.git
	# Name of production branch (default master): master
	# Name of boson branch (default boson): boson
	# Name of fermion branch (default fermion): fermion
	# Registering site as myapp

Then deploy:

	$ spin-nginx deploy myapp fermion --settings=settings.json

	# [2016-05-09T02:50:22.455Z] shutting down myapp:fermion
	# [2016-05-09T02:50:22.457Z] clearing out old files
	# [2016-05-09T02:50:22.458Z] cloning the repo
	# [2016-05-09T02:50:22.459Z] running install
	# [2016-05-09T02:50:22.459Z] running: test
	# [2016-05-09T02:50:22.459Z] running: build
	# [2016-05-09T02:50:22.460Z] running: start
	# [2016-05-09T02:50:22.460Z] running: isup
	# [2016-05-09T02:50:22.461Z] running: nginx
	# [2016-05-09T02:50:22.461Z] make copy of existing nginx.conf
	# [2016-05-09T02:50:22.461Z] exec: cp -f /usr/local/etc/nginx/sites-enabled/myapp.conf /tmp/.rollback-myapp.conf
	# [2016-05-09T02:50:22.469Z] deploying the new nginx conf
	# [2016-05-09T02:50:22.469Z] exec: cp /tmp/myapp-fermion/nginx.conf /usr/local/etc/nginx/sites-enabled/myapp.conf
	# [2016-05-09T02:50:22.483Z] exec: nginx -t
	# nginx: the configuration file /usr/local/etc/nginx/nginx.conf syntax is ok
	# nginx: configuration file /usr/local/etc/nginx/nginx.conf test is successful
	# [2016-05-09T02:50:22.533Z] exec: nginx -s reload
	# nginx: reloaded
	# Done deploying myapp with [4000]

## license

Published and released under the [Very Open License](http://veryopenlicense.com/).

<3

[demo_app]: https://github.com/tobiaslabs/simple-crud-demo
