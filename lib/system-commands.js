const fs = require('fs')
const sh = require('./shell-tag')

module.exports = {
	stopServer: (deploy) => {
		sh`psy stop ${deploy}`
		sh`psy rm ${deploy}`
	},
	deleteFolder: (folder) => {
		sh`rm -rf ${folder}`
	},
	gitClone: (repo, branch, folder) => {
		sh`git clone --depth 1 --single-branch -b ${branch} ${repo} ${folder}`
	},
	install: (folder) => {
		sh`cd ${folder}; npm install`
	},
	test: (folder, domain, port, configurationPath) => {
		sh`cd ${folder}; export DOMAIN=${domain}; export PORT=${port}; export CONFIG=${configurationPath}; npm run test`
	},
	build: (folder, domain, port, configurationPath) => {
		sh`cd ${folder}; export DOMAIN=${domain}; export PORT=${port}; export CONFIG=${configurationPath}; npm run build`
	},
	startServer: (folder, name, domain, port, configurationPath) => {
		sh`cd ${folder}; psy start -n ${name} --logfile=${folder}.log --env.DOMAIN=${domain} --env.PORT=${port} --env.CONFIG=${configurationPath} -- npm run start`
	},
	verifyServerIsRunning: (folder, domain, port, configurationPath) => {
		sh`cd ${folder}; export DOMAIN=${domain}; export PORT=${port}; export CONFIG=${configurationPath}; npm run isup`
	},
	testNginxConfiguration: () => {
		sh`sudo nginx -t`
	},
	copyFile: (source, destination) => {
		sh`cp -rf ${source} ${destination}`
	},
	reloadNginx: () => {
		sh`sudo nginx -s reload`
	},
	readSitePackageJson: (pathToSitePackageJson) => {
		return JSON.parse(fs.readFileSync(pathToSitePackageJson, { encoding: 'utf8' }))
	}
}
