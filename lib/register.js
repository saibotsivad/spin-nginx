const co = require('co')
const prompt = require('co-prompt')

module.exports = function(options, cb) {
	if (!options.name) {
		console.error('requires a name to register, e.g.: [command] register [name]')
		process.exit(1)
	}

	if (options.settings.sites[options.name]) {
		console.error('that site name is already registered, but it needs to be unique')
		process.exit(1)
	}
	if (options.settings.ports[`${options.name}-fermion`] || options.settings.ports[`${options.name}-boson`]) {
		console.error('that site has ports registered, you need to manually deallocate them')
		process.exit(1)
	}

	console.log('Registering a new site...')

	co(function *() {
		const repo = yield prompt('Enter the URL to the repo (used in `git clone ${url}`): ')
		const branch = yield prompt('Name of branch (default `master`): ')
		const domain = yield prompt('Domain name (e.g. `site.com`): ')
		const configurationPath = yield prompt('Path to configuration file (e.g. `/path/to/config.json`): ')

		const site = {
			repo,
			branch: branch || 'master',
			domain,
			configuration: configurationPath
		}

		const reservedPorts = Object.keys(options.settings.ports)
			.reduce((map, key) => {
				map[options.settings.ports[key].fermion] = true
				map[options.settings.ports[key].boson] = true
				return map
			}, {})

		options.settings.ports = options.settings.ports || {}
		options.settings.ports[options.name] = options.settings.ports[options.name] || {}
		for (var i = options.settings.config.portRangeMin; i <= options.settings.config.portRangeMax; i++) {
			if (!reservedPorts[i]) {
				if (!options.settings.ports[options.name].fermion) {
					options.settings.ports[options.name].fermion = i
				} else if (!options.settings.ports[options.name].boson) {
					options.settings.ports[options.name].boson = i
				} else {
					break
				}
			}
		}

		const fermionPort = options.settings.ports[options.name].fermion
		const bosonPort = options.settings.ports[options.name].boson
		if (!fermionPort || !bosonPort) {
			console.log('Could not reserve enough ports!')
			process.exit(1)
		}
		console.log(`Ports reserved: fermion@${fermionPort}, boson@${bosonPort}`)

		console.log(`Site registered as ${options.name}`)
		options.settings.sites[options.name] = site

		process.stdin.pause()
		cb(options.settings)
	})

}
