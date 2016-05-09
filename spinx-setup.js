const fs = require('fs')
const path = require('path')
const co = require('co')
const prompt = require('co-prompt')

const settings = {
	config: {},
	reservedPorts: {},
	sites: {}
}

const defaultPortRangeMin = 4000
const defaultPortRangeMax = 6000

module.exports = function(options, cb) {
	console.log('Configuring new spinx setup...')
	co(function *() {
		const portRangeMin = yield prompt(`Enter the minimum port number (default ${defaultPortRangeMin}): `)
		const portRangeMax = yield prompt(`Enter the maximum port number (default ${defaultPortRangeMax}): `)
		const deployFolder = yield prompt('Enter the folder name where `git clone` happens: ')
		const nginxFolder = yield prompt('Enter the folder where nginx.conf files should go: ')

		settings.config.portRangeMin = parseInt(portRangeMin, 10) || defaultPortRangeMin
		settings.config.portRangeMax = parseInt(portRangeMax, 10) || defaultPortRangeMax
		settings.config.deployFolder = deployFolder
		settings.config.nginxFolder = nginxFolder

		if (settings.config.portRangeMin >= settings.config.portRangeMax) {
			console.log('Error! portRangeMin >= portRangeMax')
			process.exit(1)
		}

		assertFolderIsWritable(settings.config.deployFolder)
		assertFolderIsWritable(settings.config.nginxFolder)

		console.log('Done!')
		process.stdin.pause()
		cb(settings)
	})
}

function assertFolderIsWritable(folder) {
	const testName = 'testing-that-spinx-has-permissions'
	try {
		fs.mkdirSync(path.join(folder, testName))
		fs.rmdirSync(path.join(folder, testName))
	} catch (e) {
		console.log('Error! Could not write to specified folder (does it exist?):')
		console.log(folder)
		console.log('Here is the actual error:')
		console.log(e)
		process.exit(1)
	}
}
