module.exports = function(options) {
	const log = console.log

	log('registered sites:')

	Object.keys(options.settings.sites).forEach(site => {
		const spin = options.settings.sites[site].deployedSpin
		if (spin) {
			const ports = JSON.stringify(options.settings.reservedPorts[site][spin])
			log(`  ${site} (deployed: ${spin} on ports ${ports})`)
		} else {
			log(`  ${site} (not deployed)`)
		}
	})

	process.exit(1)
}
