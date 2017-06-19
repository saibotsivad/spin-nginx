const executor = require('./lib/executor.js')
const rollback = require('./lib/rollback.js')(executor)

module.exports = function(options, cb) {
	try {
		rollback(options.settings, options.name, cb)
	} catch (e) {
		console.log(e)
		process.exit(1)
	}
}
