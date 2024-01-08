const { join } = require('node:path')
const { getVersion } = require('../get-version')
const { appendFile, writeFile, readFile } = require('node:fs/promises')

if (require.main === module) {
  void main()
}

/**
 * @typedef {object} VersionObject
 * @property {string} version
 * @property {string} packageVersion
 * @property {string} [buildNumber]
 */

/**
 * Accept optional CLI arg as the "build number".
 *
 * Output the final build version to GITHUB_OUTPUT.VERSION, and write it to
 * `./src/version.json`
 */
async function main() {

  const argBuildNumber = process.argv[2]
  const buildNumber = argBuildNumber ? `${argBuildNumber}` : undefined

  const packageVersion = getVersion()

  const version = packageVersion + (buildNumber ? `+${buildNumber}` : '')

  if (!buildNumber) {
    console.info(`'No build number provided, but that's okay'`)
  }

  const versionObject = {
    version,
    packageVersion,
    buildNumber,
  }

  console.info('versionObject:', versionObject)

  await Promise.all([
    outputToGithubOutput(versionObject),
    writeToVersionJson(versionObject),
    writeToNgswConfig(versionObject),
  ])
}

/**
 * @param {VersionObject} versionObject
 */
async function outputToGithubOutput(versionObject) {
  const githubOutput = process.env.GITHUB_OUTPUT

  if (!githubOutput) {
    throw new Error('No env var GITHUB_OUTPUT')
  }

  await appendFile(githubOutput, `VERSION="${versionObject.version}"\n`)
  await appendFile(githubOutput, `PACKAGE_VERSION=${versionObject.packageVersion}\n`)
}

/**
 * write to version.json (used for MAPPER_VERSION token)
 *
 * @param {VersionObject} versionObject
 */
async function writeToVersionJson(versionObject) {
  const versionJsonPath = join(__dirname, '../../src/version.json')
  await writeFile(versionJsonPath, JSON.stringify(versionObject, undefined, 2))
}

/**
 * write to ngsw-config.json's appData section
 *
 * @param {VersionObject} versionObject
 */
async function writeToNgswConfig(versionObject) {
  const ngswConfigPath = join(__dirname, '../../ngsw-config.json')
  const ngswConfigJson = JSON.parse(await readFile(ngswConfigPath, { encoding: 'utf8' }))
  ngswConfigJson.appData.version = versionObject

  await writeFile(ngswConfigPath, JSON.stringify(ngswConfigJson, undefined, 2), {
    encoding: 'utf8',
  })

  console.info(JSON.stringify(ngswConfigJson, undefined, 2))
}
