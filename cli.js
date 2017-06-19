#!/usr/bin/env node

const spinNginx = require('./lib')
const commander = require('./lib/system-commands.js')

const argv = require('minimist')(process.argv.slice(2))

spinNginx(commander, argv)
