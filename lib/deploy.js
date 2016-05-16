const mkdirp = require('mkdirp')
const path = require('path')
const child_process = require('child_process')
const psy = require('psy')

module.exports = (executor) => {
	return (deploy, settings, cb) => {
		if (typeof deploy !== 'object') {
			throw 'must pass in deploy as object'
		}
		if (typeof settings !== 'object') {
			throw 'must pass in settings as object'
		}

		if (!deploy.name || !settings.sites[deploy.name]) {
			const sites = Object.keys(settings.sites).join(',')
			throw `site not found (${deploy.name}) must deploy a registered site: [${sites}]`
		}
		if (!deploy.spin || !settings.sites[deploy.name][deploy.spin]) {
			throw `spin not found (${deploy.spin}) for site (${deploy.name})`
		}

		const app = deploy.name + '-' + deploy.spin
		const site = settings.sites[deploy.name]
		const deployFolder = settings.config.deployFolder
		const appSpinFolder = path.join(deployFolder, app)

		executor.shutDownOldServer(app)
		if (settings.reservedPorts[deploy.name]) {
			delete settings.reservedPorts[deploy.name][deploy.spin]
		}

		executor.makeDirectory(deployFolder)

		executor.removeDirectory(appSpinFolder)

		executor.cloneRepository(deployFolder, site, app)

		const package = require(path.join(appSpinFolder, 'package.json'))
		if (!package.config) {
			throw 'config property not found in package.json'
		}
		if (!package.config.quantityOfPorts) {
			throw 'config.quantityOfPorts not found in package.json'
		}

		executor.npmRunInstall(appSpinFolder)
		executor.npmRunTest(appSpinFolder)
		executor.npmRunBuild(appSpinFolder)

		const ports = getPortsForApp(settings, package.config.quantityOfPorts)
		if (!settings.reservedPorts[deploy.name]) {
			settings.reservedPorts[deploy.name] = {}
		}
		settings.reservedPorts[deploy.name][deploy.spin] = ports

		const jsonPorts = JSON.stringify(ports)

		executor.startServer(appSpinFolder, app, ports)
		executor.makeSureServerIsUp(appSpinFolder, package.name, ports)
		executor.buildNginxConfFile(appSpinFolder, package.name, ports)
		executor.makeBackupOfDeployedNginxConfFile(settings.config.nginxFolder, settings.config.deployFolder, deploy.name)
		executor.deployNginx(path.join(appSpinFolder, package.config.nginxConfFile), path.join(settings.config.nginxFolder, deploy.name) + '.conf')

		cb(settings)
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
	throw 'could not reserve enough numbers!'
}
