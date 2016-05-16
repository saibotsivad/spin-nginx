const test = require('tape')
const copy = require('shallow-copy')
const deployer = require('../lib/deploy.js')

const executorFunctionNames = [
	'shutDownOldServer',
	'makeDirectory',
	'removeDirectory',
	'cloneRepository',
	'npmRunInstall',
	'npmRunTest',
	'npmRunBuild',
	'startServer',
	'makeSureServerIsUp',
	'buildNginxConfFile',
	'makeBackupOfDeployedNginxConfFile',
	'deployNginx'
]

const executor = executorFunctionNames.reduce((map, key) => {
	map[key] = () => {}
	return map
}, {})

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

test('mocked with noop executors works fine', t => {
	t.plan(5)
	const testExecutor = copy(executor)
	testExecutor.startServer = (appSpinFolder, app, packageName, ports) => {
		t.equal(appSpinFolder, '../test/fixtures/demo-fermion', 'the app spin folder name is constructed correctly')
		t.equal(app, 'demo-fermion', 'constructed app name')
		t.deepEqual(ports, [ 1, 2 ], 'should yield the correct number of ports')
	}
	deployer(testExecutor)(copy(deploy), copy(settings), (out) => {
		t.ok(out, 'should return settings object')
		t.equal(out.reservedPorts.demo.fermion[0], 1, 'reserved port should be the only available one')
		t.end()
	})
})

test('mocked with a throwing executor stops the rest from running', t => {
	t.plan(1)
	const testExecutor = copy(executor)
	try {
		executor.makeDirectory = () => { throw 'some failure' }
		executor.removeDirectory = () => { t.fail('this next thing should not run') }
		deployer(executor)(copy(deploy), copy(settings), () => { t.fail('') })
	} catch (e) {
		t.pass('should catch the throw')
		t.end()
	}
})

function buildExecutorWithSomePassingAndSomeThrowing(builderIndex, t) {
	return executorFunctionNames.reduce((map, name, nameIndex) => {
		if (nameIndex > builderIndex) {
			map[name] = () => { t.fail('this executor function should not be called') }
		} else if (nameIndex < builderIndex) {
			map[name] = () => { t.pass('this executor function should be called') }
		} else {
			map[name] = () => { throw 'mock a thrown executor error' }
		}
		return map
	}, {})
}

test('if any one of the noop fails none of the rest are run', t => {
	var numberOfRunnableExecutorFunctions = executorFunctionNames.reduce((sum, name, index) => {
		return sum += (index + 1)
	}, 0)

	t.plan(numberOfRunnableExecutorFunctions)

	const builtExecutors = executorFunctionNames.map((name, index) => {
		return buildExecutorWithSomePassingAndSomeThrowing(index, t)
	})

	builtExecutors.forEach(ex => {
		try {
			deployer(ex)(copy(deploy), copy(settings), () => {
				t.fail('all executor tests throw so this should not run')
			})
		} catch (e) {
			t.pass('throwable is caught')
		}
	})
})
