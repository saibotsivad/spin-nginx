const child_process = require('child_process')
const mkdirp = require('mkdirp')
const rimraf = require('rimraf')
const psy = require('psy')

module.exports = {
	makeDirectory: dir => {
		log('create directory: ' + dir)
		return mkdirp.sync(dir)
	},
	removeDirectory: dir => {
		log('remove directory: ' + dir)
		return rimraf.sync(dir)
	},
	shutDownOldServer: app => {
		log(`shutting down ${app}`)
		exec(undefined, `psy stop ${app}`)
	},
	cloneRepository: (deployFolder, site, app) => {
		log(`cloning the repo`)
		exec(deployFolder, `git clone --depth 1 -b ${site.master} ${site.repo} ${app}`)
	},
	npmRunInstall: dir => {
		exec(dir, `npm install`)
	},
	npmRunTest: dir => {
		exec(dir, `npm run test`)
	},
	npmRunBuild: dir => {
		exec(dir, `npm run build`)
	},
	startServer: (dir, app, ports) => {
		exec(dir, `psy start --env.npm_package_config_ports=${JSON.stringify(ports)} -n ${app} -- npm run start`)
	},
	makeSureServerIsUp: (dir, packageName, ports) => {
		exec(dir, `npm run isup --${packageName}:ports=${JSON.stringify(ports)}`)
	},
	buildNginxConfFile: (dir, packageName, ports) => {
		exec(dir, `npm run nginx --${packageName}:listen=80 --${packageName}:ports=${JSON.stringify(ports)}`)
	},
	makeBackupOfDeployedNginxConfFile: (nginxFolder, deployFolder, name) => {
		log(`make copy of existing nginx.conf`)
		const rollbackName = `.rollback-${name}.conf`
		exec(undefined, `cp ${nginxFolder}/${name}.conf ${deployFolder}/${rollbackName}`)
	},
	deployNginx: (builtConf, existingConf) => {
		log(`deploying the new nginx conf`)
		exec(undefined, `cp ${builtConf} ${existingConf}`)
		exec(undefined, `nginx -t`)
		exec(undefined, `nginx -s reload`)
	}
}

function log(message) {
	console.log(`[${new Date().toISOString()}] ${message}`)
}

function exec(cwd, command) {
	try {
		if (cwd) {
			log(`exec (${cwd}): ` + command)
		} else {
			log(`exec: ` + command)
		}
		return child_process.execSync(command, {
			cwd: cwd,
			stdio: [ 0, 1, 2 ],
			encoding: 'utf8'
		})
	} catch (e) {
		log('Error running command! Command: ' + command)
		throw e
	}
}
