const fs = require('fs')
const path = require('path')

const requiredProperties = {
	portRangeMin: 'number',
	portRangeMax: 'number',
	deployFolder: 'string',
	nginxFolder: 'string'
}

const settings = {
	config: {},
	reservedPorts: {},
	sites: {}
}

module.exports = options => {
	if (typeof options !== 'object') {
		throw 'must pass in options'
	}
	Object.keys(requiredProperties).forEach(key => {
		if (typeof options[key] !== requiredProperties[key]) {
			throw `required property missing (${key}) or incorrect type (${requiredProperties[key]})`
		}
	})
	if (options.portRangeMin >= options.portRangeMax) {
		throw `portRangeMin must less than portRangeMax`
	}
	assertFolderIsWritable(options.deployFolder)
	assertFolderIsWritable(options.nginxFolder)

	settings.config = options
	return settings
}

function assertFolderIsWritable(folder) {
	const testName = 'testing-that-spinx-has-permissions'
	try {
		fs.mkdirSync(path.join(folder, testName))
		fs.rmdirSync(path.join(folder, testName))
	} catch (e) {
		throw 'could not write to specified folder: ' + folder + '\n' + e
	}
}