# spin-nginx

CLI tool to do spins of websites with NGINX.

## install

The normal npm way, but globally:

	npm install -g spin-nginx

## first you need to configure it

Run this:

	spin-nginx setup

It'll prompt you for things and make sure the things work.

## register a site

You add named sites which are pointed at a github repo.

You will need a master repo, and two branches (currently
unused, but will probably get pushed to when new spins
are deployed):

	spin-nginx register [app name]

E.g.

	spin-nginx register myapp


It will prompt you for the Github repo URL and some
other stuff.

## deploy

Right now you have to specify which spin you want deployed:

	spin-nginx deploy [app name] [spin]

E.g.

	spin-nginx deploy mycrudapp fermion

It'll do a *lot* of stuff that I need to document here.

# EXAMPLE

Try out with the [site demo](https://github.com/tobiaslabs/simple-crud-demo)
that I put together.

First run the setup:

	$ spin-nginx setup

	# Configuring new spinx setup...
	# Enter the minimum port number (default 4000): 4000
	# Enter the maximum port number (default 5000): 5000
	# Enter the folder name where `git clone` happens: /tmp
	# Enter the folder where nginx.conf files should go: /usr/local/etc/nginx/sites-enabled
	# Done!

Then register, using the demo app git url:

	$ spin-nginx register myapp

	# Registering a new site...
	# Enter the URL to the repo (used in `git clone ${url}`): https://github.com/tobiaslabs/simple-crud-demo.git
	# Name of production branch (default master): master
	# Name of boson branch (default boson): boson
	# Name of fermion branch (default fermion): fermion
	# Registering site as myapp

Then deploy:

	$ spin-nginx deploy myapp fermion
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
