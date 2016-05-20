const executor = require('./lib/executor.js')
const deployer = require('./lib/deploy.js')(executor)

const mkdirp = require('mkdirp')
const path = require('path')
const child_process = require('child_process')
var psy = require('psy')

module.exports = function(options, cb) {
	const spin = options.argv._[2]
	try {
		deployer({
			name: options.name,
			spin: spin
		}, options.settings, updatedSettings => {
			const actualSpin = updatedSettings.sites[options.name].deployedSpin
			const ports = updatedSettings.reservedPorts[options.name][actualSpin]
			console.log(`Done deploying ${options.name} with spin ${actualSpin} and ports ${JSON.stringify(ports)}`)
			cb(updatedSettings)
		})
	} catch (e) {
		console.log(e)
		process.exit(1)
	}
}
