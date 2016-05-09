const mkdirp = require('mkdirp')
const path = require('path')
const child_process = require('child_process')
var psy = require('psy')

module.exports = function(options, cb) {
	if (!options.name) {
		console.log('Must deploy a registered site:')
		Object.keys(options.settings.sites).forEach(site => console.log(`  ${site}`))
		process.exit(1)
	}

	const spin = options.argv._[2]
	if (!spin) {
		console.log('Deploying requires specifying the spin, for now.')
		console.log('TODO: figure out how to not specify the spin.')
		process.exit(1)
	}

	const app = options.name + '-' + spin
	const site = options.settings.sites[options.name]

	if (!site[spin]) {
		console.log(`No spin '${spin}' specified for '${options.name}`)
		process.exit(1)
	}

	const deployFolder = options.settings.config.deployFolder
	const appSpinFolder = path.join(deployFolder, app)

	mkdirp.sync(deployFolder)

	log(`shutting down ${options.name}:${spin}`)
	exec(undefined, `psy kill ${app}`)
	if (options.settings.reservedPorts[options.name]) {
		delete options.settings.reservedPorts[options.name][spin]
	}

	log(`clearing out old files`)
	exec(undefined, `rm -rf ${appSpinFolder}`)

	log(`cloning the repo`)
	exec(deployFolder, `git clone --depth 1 -b ${site.master} ${site.repo} ${app}`)

	const package = require(path.join(appSpinFolder, 'package.json'))
	if (!package.config || !package.config.quantityOfPorts) {
		console.log('site does not have required properties configured!')
		console.log('properties referenced in package.json `config` property:')
		console.log('   quantityOfPorts: (int, required) number of ports the deployed site uses')
		process.exit(1)
	}

	log(`running install`)
	exec(appSpinFolder, `npm install`)

	npmRun(package, 'test', () => {
		exec(appSpinFolder, `npm run test`)
	})

	npmRun(package, 'build', () => {
		exec(appSpinFolder, `npm build`)
	})

	const ports = getPortsForApp(options.settings, package.config.quantityOfPorts)
	if (!options.settings.reservedPorts[options.name]) {
		options.settings.reservedPorts[options.name] = {}
	}
	options.settings.reservedPorts[options.name][spin] = ports

	const jsonPorts = JSON.stringify(ports)

	npmRun(package, 'start', () => {
		exec(appSpinFolder, `psy start --env.npm_package_config_ports=${jsonPorts} -n ${app} -- npm run start`)
	})

	npmRun(package, 'isup', () => {
		exec(appSpinFolder, `npm run isup --${package.name}:ports=${jsonPorts}`)
	})

	npmRun(package, 'nginx', () => {
		exec(appSpinFolder, `npm run nginx  --${package.name}:listen=80 --${package.name}:ports=${jsonPorts}`)
	})

	log(`make copy of existing nginx.conf`)
	const rollbackName = `.rollback-${options.name}.conf`
	exec(undefined, `cp ${options.settings.config.nginxFolder}/${options.name}.conf ${options.settings.config.deployFolder}/${rollbackName}`)

	log(`deploying the new nginx conf`)
	exec(undefined, `cp ${appSpinFolder}/${package.config.nginxConfFile} ${options.settings.config.nginxFolder}/${options.name}.conf`)
	exec(undefined, `nginx -t`)
	exec(undefined, `nginx -s reload`)

	log(`Done deploying ${app} with ${jsonPorts}`)
	cb(options.settings)
}

function log(log) {
	console.log(`[${new Date().toISOString()}] ${log}`)
}

function npmRun(package, name, cb) {
	if (package.scripts && package.scripts[name]) {
		log(`running: ${name}`)
		cb()
	} else {
		log(`skipping: ${name}`)
	}
}

function exec(cwd, command) {
	try {
		if (cwd) {
			log(`exec (${cwd}): ` + command)
		} else {
			log(`exec: ` + command)
		}
		return child_process.execSync(command, {
			cwd: cwd,
			// stdio: [ 0, 1, 2 ],
			encoding: 'utf8'
		})
	} catch (e) {
		console.log('Error running command! Command: ' + command)
		console.log('The actual error:')
		console.log(e)
		process.exit(1)
	}
}

function getPortsForApp(settings, quantityOfPorts) {
	const portsInUse = getUsedPortsMap(settings)
	return reservePorts(settings, portsInUse, quantityOfPorts)
}

function getUsedPortsMap(settings) {
	const usedPorts = {}
	Object.keys(settings.reservedPorts).forEach(name => {
		Object.keys(settings.reservedPorts[name]).forEach(spin => {
			settings.reservedPorts[name][spin].forEach(port => {
				usedPorts[port] = true
			})
		})
	})
	return usedPorts
}

function reservePorts(settings, usedPortsMap, quantityOfPorts) {
	const min = settings.config.portRangeMin
	const max = settings.config.portRangeMax
	const ports = []
	for (var i = min; i <= max; i++) {
		if (!usedPortsMap[i]) {
			ports.push(i)
		}
		if (ports.length === quantityOfPorts) {
			return ports
		}
	}
	console.error('could not reserve enough numbers!')
	process.exit(1)
}
