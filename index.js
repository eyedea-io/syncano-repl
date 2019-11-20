#!/usr/bin/env node
const repl = require('repl')
const Syncano = require('@syncano/core')
const {execSync} = require('child_process')
const fs = require('fs')
const path = require('path')
const {red, cyan} = require('colorette')
const {getSyncanoContext, printBanner, checkUpdate} = require('./helpers')

const RESPONSE_FILE = '.syncano-repl-response.json'
const HISTORY_FILE = '.syncano-repl-history'
const FX = path.resolve(__dirname, 'node_modules', 'fx')

;(async () => {
  const ctx = getSyncanoContext()
  const s = new Syncano(ctx)
  let owner = {}
  try {
    owner = await s.account.get(ctx.token)
  } catch (err) {}

  process.stdout.write('\u001B[2J\u001B[0;0f')
  printBanner()
  console.log('instance: ', (ctx.instanceName ? cyan : red)(ctx.instanceName))
  console.log('location: ', (ctx.location ? cyan : red)(ctx.location))
  console.log('   token: ', (ctx.token ? cyan : red)(ctx.token))
  console.log('   email: ', (owner.email ? cyan : red)(owner.email))

  if (!ctx.instanceName) {
    console.log('')
    console.error(red('Error: Syncano instance not detected!'))
    process.exit(1)
  }
  if (!ctx.token) {
    console.log('')
    console.error(red('Error: Syncano auth token not detected!'))
    process.exit(1)
  }

  // Check if instance belongs to account
  try {
    await s.instance.get(ctx.instanceName)
  } catch (err) {
    const msg = `Error: Instance ${JSON.stringify(
      ctx.instanceName
    )} was not found on ${JSON.stringify(owner.email)} account!`
    console.log('')
    console.error(red(msg))
    process.exit(1)
  }

  await checkUpdate()

  const server = repl.start({
    replMode: repl.REPL_MODE_STRICT,
    eval: async (cmd, context, filename, callback) => {
      const res = await eval(cmd)
      process.stdout.write('\u001B[2J\u001B[0;0f')
      callback(null, res)
    },
    writer: res => {
      if ((typeof res === 'object' && res !== null) || Array.isArray(res)) {
        fs.writeFileSync(RESPONSE_FILE, JSON.stringify(res, null, 2), () => {})
        try {
          server.outputStream.write(
            execSync(`node ${FX} ${RESPONSE_FILE}`, {
              stdio: 'inherit',
            })
          )
        } catch (err) {}
        return '\u001B[2J\u001B[0;0f'
      } else {
        return res
      }
    },
  })

  // Save REPL history
  server.setupHistory(HISTORY_FILE, () => {})

  // Expose syncano core methods
  server.context.s = s
})()
