#!/usr/bin/env node

const fs = require('fs')
const argv = require('minimist')(process.argv.slice(2))

const action = argv._[0]
const name = argv._[1]
const settingsFileName = argv.settings

if (!settingsFileName) {
	console.log('required parameter missing: --settings=/path/to/settings.json')
	process.exit(1)
}

const settings = possiblyLoadSettings()

const actions = {
	setup: require('./cli-setup.js'),
	register: require('./cli-register.js'),
	deploy: require('./cli-deploy.js'),
	rollback: require('./cli-rollback.js')
}

if (actions[action]) {
	actions[action]({ action, name, settings, argv }, updatedSettings => {
		if (updatedSettings) {
			writeSettingsFile(updatedSettings)
		}
	})
} else {
	helpExit()
}

function writeSettingsFile(data) {
	const output = JSON.stringify(data, undefined, 2)
	fs.writeFileSync(settingsFileName, output, { encoding: 'utf8' })
}

function possiblyLoadSettings() {
	var data
	try {
		data = fs.readFileSync(settingsFileName, { encoding: 'utf8' })
	} catch (ignore) {
	}

	if (action === 'setup' && data) {
		console.log('Settings file already exists!')
		console.log('You will need to delete the settings file first: ' + settingsFileName)
		process.exit(1)
	} else if (action === 'setup') {
		return undefined
	} else if (!data) {
		console.log('Settings file not found! Did you run the setup yet?')
		helpExit()
	} else {
		return JSON.parse(data)
	}
}

function helpExit() {
	console.log('use like: spin [action] [site name]')
	console.log('where [action] is: setup, register, deploy, rollback')
	process.exit(1)	
}
