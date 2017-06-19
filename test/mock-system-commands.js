const extend = require('extend')

function noop() {}

const defaultCommands = {
	stopServer: noop,
	deleteFolder: noop,
	gitClone: noop,
	install: noop,
	test: noop,
	build: noop,
	startServer: noop,
	verifyServerIsRunning: noop,
	testNginxConfiguration: noop,
	copyFile: noop,
	reloadNginx: noop,
	readSitePackageJson: noop
}

module.exports = (overrides) => {
	return extend(defaultCommands, overrides)
}
