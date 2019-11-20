const fs = require('fs')
const path = require('path')
const os = require('os')
const yaml = require('js-yaml')
const Cache = require('file-system-cache').default
const findCacheDir = require('find-cache-dir')
const fetch = require('node-fetch')
const semver = require('semver')
const boxen = require('boxen')
const pjson = require('./package.json')
const {green, blue} = require('colorette')

const cacheDir = findCacheDir({name: 'syncano-repl'})
const cache = Cache({
  basePath: cacheDir,
  ns: 'syncano-repl',
})

function getSyncanoContext() {
  const configPath = path.join(os.homedir(), `syncano.yml`)
  let config = {}

  try {
    config = yaml.load(fs.readFileSync(configPath, 'utf8')) || {}
  } catch (err) {}

  const token = process.env.SYNCANO_AUTH_KEY || config.auth_key
  const location =
    process.env.SYNCANO_PROJECT_INSTANCE_LOCATION ||
    getLocationFromConfig(config) ||
    'us1'

  return {
    token,
    accountKey: token,
    instanceName:
      process.env.SYNCANO_PROJECT_INSTANCE || getInstanceFromConfig(config),
    location,
    host: {
      us1: 'api.syncano.io',
      eu1: 'api-eu1.syncano.io',
    }[location],
  }
}

function getInstanceFromConfig(config) {
  try {
    return config.projects[__dirname].instance
  } catch (err) {}
  return undefined
}

function getLocationFromConfig(config) {
  try {
    return config.projects[__dirname].location
  } catch (err) {}
  return undefined
}

function printBanner() {
  if (process.stdout.columns >= 110) {
    console.log(`
███████╗██╗   ██╗███╗   ██╗ ██████╗ █████╗ ███╗   ██╗ ██████╗     ██████╗ ███████╗██████╗ ██╗
██╔════╝╚██╗ ██╔╝████╗  ██║██╔════╝██╔══██╗████╗  ██║██╔═══██╗    ██╔══██╗██╔════╝██╔══██╗██║
███████╗ ╚████╔╝ ██╔██╗ ██║██║     ███████║██╔██╗ ██║██║   ██║    ██████╔╝█████╗  ██████╔╝██║
╚════██║  ╚██╔╝  ██║╚██╗██║██║     ██╔══██║██║╚██╗██║██║   ██║    ██╔══██╗██╔══╝  ██╔═══╝ ██║
███████║   ██║   ██║ ╚████║╚██████╗██║  ██║██║ ╚████║╚██████╔╝    ██║  ██║███████╗██║     ███████╗
╚══════╝   ╚═╝   ╚═╝  ╚═══╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝     ╚═╝  ╚═╝╚══════╝╚═╝     ╚══════╝
`)
  }
}

cache.clear()

async function checkUpdate() {
  let result
  const time = Date.now()
  try {
    const fromCache = await cache.get('lastUpdateCheck', {
      success: false,
      time: 0,
    })
    const twentyFourHours = 86400000

    if (time - twentyFourHours > fromCache.time) {
      const fromFetch = await Promise.race([
        fetch(`https://registry.npmjs.org/syncano-repl/latest`),
        // if fetch is too slow, we won't wait for it
        new Promise((res, rej) => global.setTimeout(rej, 1500)),
      ])
      const data = await fromFetch.json()
      result = {success: true, data, time}
      await cache.set('lastUpdateCheck', result)
    } else {
      result = fromCache
    }
  } catch (error) {
    result = {success: false, error, time}
  }

  if (result.data && result.data.version) {
    const latest = result.data.version
    const current = pjson.version

    if (semver.gt(latest, current)) {
      console.log(
        boxen(
          `Update available ${current} ➝ ${green(latest)}\nRun ${blue(
            'npm i -g syncano-repl'
          )} to update`,
          {
            padding: 1,
            borderColor: 'green',
          }
        )
      )
    }
  }

  return result
}

module.exports = {
  printBanner,
  checkUpdate,
  getSyncanoContext,
  getInstanceFromConfig,
  getLocationFromConfig,
}
