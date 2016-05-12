const test = require('tape')
const copy = require('shallow-copy')
const deployer = require('../lib/deploy.js')

const executor = {
	makeDirectory: folder => {},
	removeDirectory: dir => {},
	shutDownOldServer: app => {},
	cloneRepository: (deployFolder, site, app) => {},
	npmRunInstall: dir => {},
	npmRunTest: dir => {},
	npmRunBuild: dir => {},
	startServer: (dir, app, ports) => {},
	makeSureServerIsUp: (dir, packageName, ports) => {},
	buildNginxConfFile: (dir, packageName, ports) => {},
	makeBackupOfDeployedNginxConfFile: (nginxFolder, deployFolder, name) => {},
	deployNginx: (builtConf, existingConf) => {}
}

test('mocked with noop executors works fine', t => {
	t.plan(5)
	const deploy = {
		name: 'demo',
		spin: 'fermion'
	}
	const settings = {
		sites: {
			demo: {
				fermion: {}
			}
		},
		config: {
			portRangeMin: 1,
			portRangeMax: 2,
			deployFolder: '../test/fixtures',
			nginxFolder: 'test/fixtures/writable'
		},
		reservedPorts: {}
	}
	const testExecutor = copy(executor)
	executor.startServer = (appSpinFolder, app, ports) => {
		t.equal(appSpinFolder, '../test/fixtures/demo-fermion', 'the app spin folder name is constructed correctly')
		t.equal(app, 'demo-fermion', 'constructed app name')
		t.deepEqual(ports, [ 1, 2 ], 'should yield the correct number of ports')
	}
	deployer(executor)(deploy, settings, (out) => {
		t.ok(out, 'should return settings object')
		t.equal(out.reservedPorts.demo.fermion[0], 1, 'reserved port should be the only available one')
		t.end()
	})
})

test('mocked with a throwing executor stops the rest from running', t => {
	t.plan(1)
	const deploy = {
		name: 'demo',
		spin: 'fermion'
	}
	const settings = {
		sites: {
			demo: {
				fermion: {}
			}
		},
		config: {
			portRangeMin: 1,
			portRangeMax: 2,
			deployFolder: '../test/fixtures',
			nginxFolder: 'test/fixtures/writable'
		},
		reservedPorts: {}
	}
	const testExecutor = copy(executor)
	try {
		executor.makeDirectory = () => { throw 'some failure' }
		executor.shutDownOldServer = () => { t.fail('this next thing should not run') }
		deployer(executor)(deploy, settings, () => { t.fail('') })
	} catch (e) {
		t.pass('should catch the throw')
		t.end()
	}
})


function buildExecutorWithPassingAndThrowing(functionNames, builderIndex, t) {
	return functionNames.reduce((map, name, nameIndex) => {
		if (nameIndex > builderIndex) {
			map[name] = () => { t.fail('this executor function should not be called') }
		} else {
			map[name] = () => { t.pass('this executor function should be called') }
		}
		return map
	}, {})
}

// test('if one of the noop fails none of the rest are run', t => {
// 	const deploy = {
// 		name: 'demo',
// 		spin: 'fermion'
// 	}
// 	const settings = {
// 		sites: {
// 			demo: {
// 				fermion: {}
// 			}
// 		},
// 		config: {
// 			portRangeMin: 1,
// 			portRangeMax: 2,
// 			deployFolder: '../test/fixtures',
// 			nginxFolder: 'test/fixtures/writable'
// 		},
// 		reservedPorts: {}
// 	}
// 	const executorFunctionNames = Object.keys(executor)

// 	var numberOfRunnableExecutorFunctions = 0
// 	var testableExecutors = []
// 	executorFunctionNames.forEach((name, index) => {
// 		const builtExecutor = buildExecutorWithPassingAndThrowing(executorFunctionNames, index, t)
// 		testableExecutors.push(builtExecutor)
// 		numberOfRunnableExecutorFunctions += (index + 1)
// 	})

// console.log(testableExecutors)

// 	t.plan(numberOfRunnableExecutorFunctions)

// 	testableExecutors.forEach(ex => {
// 		deployer(ex)(deploy, settings, () => {
// 			// the very last one runs all executors, so finishes the test
// 			t.end()
// 		})
// 	})
// })
