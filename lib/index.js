const fs = require('fs')

function die(message) {
	console.error(message)
	process.exit(1)
}

function write(data) {
	fs.writeFileSync(argv.settings, JSON.stringify(data, undefined, 2), { encoding: 'utf8' })
}

module.exports = (commander, argv) => {
	const command = argv._[0]
	const name = argv._[1]

	const allowedCommands = {
		setup: require('./setup.js'),
		register: require('./register.js'),
		deploy: require('./deploy.js')
	}

	if (!argv.settings) {
		die(`The parameter '--settings=/path/to/settings.json' is always required.`)
	}

	if (!allowedCommands[command]) {
		die(`That command is not understood, sorry.`)
	}

	const settings = require(argv.settings)

	allowedCommands[command](commander, { command, name, settings }, (updatedSettings) => {
		write(updatedSettings)
	})
}
