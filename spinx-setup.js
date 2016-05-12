const fs = require('fs')
const path = require('path')
const co = require('co')
const prompt = require('co-prompt')
const create = require('./lib/create-settings.js')

const defaultPortRangeMin = 4000
const defaultPortRangeMax = 6000

module.exports = function(options, cb) {
	console.log('Configuring new spinx setup...')
	co(function *() {
		const portRangeMin = yield prompt(`Enter the minimum port number (default ${defaultPortRangeMin}): `)
		const portRangeMax = yield prompt(`Enter the maximum port number (default ${defaultPortRangeMax}): `)
		const deployFolder = yield prompt('Enter the folder name where `git clone` happens: ')
		const nginxFolder = yield prompt('Enter the folder where nginx.conf files should go: ')

		try {
			const settings = create({
				portRangeMin: parseInt(portRangeMin, 10) || defaultPortRangeMin,
				portRangeMax: parseInt(portRangeMax, 10) || defaultPortRangeMax,
				deployFolder,
				nginxFolder
			})
			console.log('Done!')
			process.stdin.pause()
			cb(settings)
		} catch (e) {
			console.log(e)
			process.exit(1)
		}
	})
}
