const fs = require('fs')
const test = require('tape')
const copy = require('shallow-copy')
const create = require('../lib/create-settings.js')

const goodSettings = {
	portRangeMin: 4000,
	portRangeMax: 5000,
	deployFolder: './test',
	nginxFolder: './test'
}

test('a good set of options works correctly', t => {
	const validated = create(copy(goodSettings))
	t.equal(validated.config.portRangeMin, 4000, 'settings should come back out')
	t.end()
})

test('not setting some options is an error', t => {
	const badSettings = copy(goodSettings)
	delete badSettings.portRangeMin

	t.throws(() => create(badSettings), 'missing property should throw')
	t.end()
})

test('a non writable folder is an error', t => {
	const badSettings = copy(goodSettings)
	badSettings.deployFolder = './test/fixtures/not-writable'

	t.throws(() => create(badSettings), 'unwritable folder should throw')
	t.end()
})
