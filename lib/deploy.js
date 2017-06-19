const pathExists = require('path-exists')
const fs = require('fs')
const path = require('path')

module.exports = function(commander, options, cb) {
	if (!options.settings.sites[options.name]) {
		console.error('That site is not registered!')
		process.exit(1)
	}

	const site = options.settings.sites[options.name]
	const spin = site.deployed === 'fermion' ? 'boson' : 'fermion'
	const deploy = options.name + '-' + spin
	const deployFolder = path.join(options.settings.config.deployFolder, deploy)
	const port = options.settings.ports[options.name][spin]

	try {
		console.log('Shutting down...')
		commander.stopServer(deploy)

		console.log('Deleting old files...')
		commander.deleteFolder(deployFolder)

		console.log('Cloning the latest code...')
		commander.gitClone(site.repo, site.branch, deployFolder)

		const pathToSiteSettings = path.join(deployFolder, 'package.json')
		console.log('Path to site settings: ' + pathToSiteSettings)
		const siteSettings = commander.readSitePackageJson(pathToSiteSettings)
		if (!siteSettings.config || !siteSettings.config.nginxConfigurationFile) {
			console.error('No nginx configuration file specified!')
			process.exit(1)
		}

		console.log('Installing dependencies...')
		commander.install(deployFolder)

		console.log('Running tests...')
		commander.test(deployFolder, site.domain, port, site.configuration)

		console.log('Building...')
		commander.build(deployFolder, site.domain, port, site.configuration)

		console.log('Starting...')
		commander.startServer(deployFolder, deploy, site.domain, port, site.configuration)

		console.log('Verify site is running...')
		commander.verifyServerIsRunning(deployFolder, site.domain, port, site.configuration)

		console.log('Verify existing nginx config...')
		commander.testNginxConfiguration()

		const oldNginxConfigFile = path.join(options.settings.config.nginxFolder, options.name + '.conf')
		const newNginxConfigFile = path.join(deployFolder, siteSettings.config.nginxConfigurationFile)

		if (pathExists.sync(oldNginxConfigFile)) {
			console.log('Create backup of nginx configuration...')
			commander.copyFile(oldNginxConfigFile, path.join(deployFolder, '.nginx-backup.conf'))
		}

		console.log('Deploying nginx configuration...')
		commander.copyFile(newNginxConfigFile, path.join(options.settings.config.nginxFolder, options.name + '.conf'))

		console.log('Verify nginx configuration...')
		commander.testNginxConfiguration()

		console.log('Reload nginx configuration...')
		commander.reloadNginx()

	} catch (e) {
		if (e.cmd) {
			console.error(`failed at the command: ${e.cmd}`)
		} else {
			console.error(`failed with error: ${e}`)
		}
		process.exit(1)
	}

	console.log('Deploy is complete!')
	options.settings.sites[options.name].deployed = spin
	return options
}
