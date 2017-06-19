const test = require('tape')
const path = require('path')
const spin = require('../lib')
const mockShellCommands = require('./mock-system-commands.js')

const fixtureAbsolutePath = path.join(path.join(__dirname, 'testables'), 'normal-operation')
const settingsPath = path.join(fixtureAbsolutePath, 'settings.json')

const settings = require(settingsPath)
settings.config.nginxFolder = fixtureAbsolutePath

const sitePackageJson = require(path.join(fixtureAbsolutePath, 'package.json'))

const deployName = 'test-boson'
const wwwDeployedPath = path.join(settings.config.deployFolder, deployName)

test('normal operation is a success', t => {
	t.plan(25)

	function noop() {}
	var timesCopyCommandHasBeenRun = 0

	const commands = {
		stopServer: (stopName) => {
			t.equal(stopName, deployName)
		},
		deleteFolder: (deletedFolderPath) => {
			t.equal(deletedFolderPath, wwwDeployedPath)
		},
		gitClone: (clonedRepoUrl, clonedBranch, clonedPath) => {
			t.equal(clonedRepoUrl, settings.sites.test.repo)
			t.equal(clonedBranch, settings.sites.test.branch)
			t.equal(clonedPath, wwwDeployedPath)
		},
		install: (clonedPath) => {
			t.equal(clonedPath, wwwDeployedPath)
		},
		readSitePackageJson: (pathToSitePackageJson) => {
			t.equal(pathToSitePackageJson, path.join(settings.config.deployFolder, deployName, 'package.json'))
			return sitePackageJson
		},
		test: (clonedPath) => {
			t.equal(clonedPath, wwwDeployedPath)
		},
		build: (clonedPath) => {
			t.equal(clonedPath, wwwDeployedPath)
		},
		startServer: (clonedPath, startName, domain, port, configurationPath) => {
			t.equal(clonedPath, wwwDeployedPath)
			t.equal(startName, deployName)
			t.equal(domain, settings.sites.test.domain)
			t.equal(port, settings.ports.test.boson)
			t.equal(configurationPath, settings.sites.test.configuration)
		},
		verifyServerIsRunning: (clonedPath, domain, port, configurationPath) => {
			t.equal(clonedPath, wwwDeployedPath)
			t.equal(domain, settings.sites.test.domain)
			t.equal(port, settings.ports.test.boson)
			t.equal(configurationPath, settings.sites.test.configuration)
		},
		testNginxConfiguration: () => {
			t.pass()
		},
		copyFile: (source, destination) => {
			if (timesCopyCommandHasBeenRun === 0) {
				t.equal(source, path.join(fixtureAbsolutePath, 'test.conf'))
				t.equal(destination, path.join(settings.config.deployFolder, deployName, '.nginx-backup.conf'))
			} else if (timesCopyCommandHasBeenRun === 1) {
				t.equal(source, path.join(settings.config.deployFolder, deployName, sitePackageJson.config.nginxConfigurationFile))
				t.equal(destination, path.join(settings.config.nginxFolder, 'test.conf'))
			} else {
				t.fail('copy is run twice')
			}
			timesCopyCommandHasBeenRun++
		},
		reloadNginx: () => {
			t.pass()
		}
	}

	const argv = {
		_: [ 'deploy', 'test' ],
		settings: settingsPath
	}

	spin(commands, argv)
	t.end()
})
