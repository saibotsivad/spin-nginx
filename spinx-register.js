const co = require('co')
const prompt = require('co-prompt')

module.exports = function(options, cb) {
	if (!options.name) {
		console.log('Register with a name: spinx register [name]')
		logSitesRegistered(options.settings.sites)
		process.exit(1)
	}

	if (options.settings.sites[options.name]) {
		console.log('That name is already registered! Please use a unique name.')
		logSitesRegistered(options.settings.sites)
		process.exit(1)
	}

	console.log('Registering a new site...')

	co(function *() {
		const repo = yield prompt('Enter the URL to the repo (used in `git clone ${url}`): ')
		const master = yield prompt('Name of production branch (default master): ')
		const boson = yield prompt('Name of boson branch (default boson): ')
		const fermion = yield prompt('Name of fermion branch (default fermion): ')

		const site = {
			repo,
			master: master || 'master',
			boson: boson || 'boson',
			fermion: fermion || 'fermion'
		}

		console.log(`Registering site as ${options.name}`)
		options.settings.sites[options.name] = site

		process.stdin.pause()
		cb(options.settings)
	})

}

function logSitesRegistered(sites) {
	console.log('Registered sites:')
	Object.keys(sites).forEach(key => console.log(`  ${key}`))
}