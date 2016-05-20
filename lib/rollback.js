module.exports = (executor) => {
	return (settings, appName, cb) => {
		const rollbackConfFile = `${settings.config.deployFolder}/.rollback-${appName}.conf`
		const deployedConfFile = `${settings.config.deployFolder}/${appName}.conf`
		executor.deployNginx(rollbackConfFile, deployedConfFile, true)

		const oldSpin = settings.sites[appName].deployedSpin
		settings.sites[appName].deployedSpin = (oldSpin === 'fermion' ? 'boson' : 'fermion')

		cb(false, settings)
	}
}
