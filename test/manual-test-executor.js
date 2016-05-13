const test = require('tape')
const executor = require('../lib/executor.js')

const repoUrl = 'https://github.com/tobiaslabs/simple-crud-demo.git'
const verySmallRepoUrl = 'https://github.com/tobiaslabs/test-github-module-version.git'
const tempFolder = './test/fixtures/writable/temp-folder'
const appName = 'temp-app'
const packageName = 'simple-crud-demo'
const repoFolder = tempFolder + '/' + appName

/**
 * The gist of these tests is to verify that
 * 1) if called correctly, the executor does what it says it will do
 * 2) if the executor fails, it will throw an exception correctly
*/

test('makeDirectory', t => {
	t.plan(1)
	// mkdir -p ${0}
	executor.makeDirectory(tempFolder)
	try {
		executor.makeDirectory('/delete-this-folder')
	} catch (e) {
		t.pass('should not have access to root')
	}
	t.end()
})

test('removeDirectory', t => {
	t.plan(1)
	// rm -rf ${0}
	executor.removeDirectory(tempFolder)
	try {
		executor.removeDirectory('./test/fixtures/not-writable')
	} catch (e) {
		t.pass('cannot remove folder')
	}
	t.end()
})

test('shutDownOldServer', t => {
	// psy stop ${0}
	executor.shutDownOldServer('test-app')
	t.end()
})

test('cloneRepository', t => {
	t.plan(1)
	executor.removeDirectory(tempFolder)
	executor.makeDirectory(tempFolder)
	// cd ${0} && git clone --depth 1 -b ${1.master} ${1.repo} ${2}
	executor.cloneRepository(tempFolder, { master: 'master', repo: verySmallRepoUrl }, appName)
	executor.removeDirectory(tempFolder)
	try {
		executor.cloneRepository(tempFolder + '/does-not-exist', { master: 'master', repo: verySmallRepoUrl }, appName)
	} catch (e) {
		t.pass('folder does not exist')
	}
	t.end()
})

test('npmRunInstall', t => {
	executor.removeDirectory(tempFolder)
	executor.makeDirectory(tempFolder)
	executor.cloneRepository(tempFolder, { master: 'master', repo: verySmallRepoUrl }, appName)
	// cd ${0} && npm install
	executor.npmRunInstall(repoFolder)
	executor.npmRunInstall('./test/fixtures/not-writable')
	// running npm install in a folder without a module does not exit 1
	t.end()
})

/*

test ('npmRunTest', t => {
	// cd ${0} && npm run test
	executor.npmRunTest(repoFolder)
	t.end()
})

test('npmRunBuild', t => {
	// cd ${0} && npm run build
	executor.npmRunBuild(repoFolder)
	t.end()
})

test('startServer', t => {
	// cd ${0} && psy start --env.npm_package_config_ports=${2} -n ${1} -- npm run start
	executor.startServer(repoFolder, appName, [ 8080 ])
	t.end()
})

test('makeSureServerIsUp', t => {
	// cd ${0} && npm run isup --${1}:ports=${2}
	executor.makeSureServerIsUp(repoFolder, packageName, [ 8080 ])
	t.end()
})

test('buildNginxConfFile', t => {
	// cd ${0} && npm run nginx --${1}:listen=80 --${1}:ports=${2}
	executor.buildNginxConfFile(repoFolder, packageName, [ 8080 ])
	t.end()
})

test('makeBackupOfDeployedNginxConfFile', t => {
	// cp ${0}/${2}.conf ${1}/.rollback-${2}.conf
	executor.makeBackupOfDeployedNginxConfFile('../test/fixtures/demo-fermion', tempFolder, 'demo')
	t.end()
})

test('deployNginx', t => {
	// cp ${0} ${1} && nginx -t && nginx -s reload
	executor.deployNginx(builtConf, existingConf)
	t.end()
})

*/
