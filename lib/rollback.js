module.exports = (executor) => {
	return (settings, appName, cb) => {
		if (!settings.sites[appName].rolledBack) {
			const rollbackConfFile = `${settings.config.deployFolder}/.rollback-${appName}.conf`
			const deployedConfFile = `${settings.config.nginxFolder}/${appName}.conf`
			executor.deployNginx(rollbackConfFile, deployedConfFile, true)

			const oldSpin = settings.sites[appName].deployedSpin
			settings.sites[appName].deployedSpin = (oldSpin === 'fermion' ? 'boson' : 'fermion')

			settings.sites[appName].rolledBack = true

			cb(settings)
		} else {
			throw 'site rolled back already'
		}
	}
}
