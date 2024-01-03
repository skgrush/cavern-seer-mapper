const { join } = require('node:path')
const { getVersion } = require('../get-version')
const { appendFile, writeFile } = require('node:fs/promises')

if (require.main === module) {
  void main()
}

/**
 * Accept optional CLI arg as the "build number".
 *
 * Output the final build version to GITHUB_OUTPUT.VERSION, and write it to
 * `./src/version.json`
 */
async function main() {

  const argBuildNumber = process.argv[2]
  const buildNumber = argBuildNumber ? `+${argBuildNumber}` : undefined

  const packageVersion = getVersion()

  const version = packageVersion + buildNumber

  if (!buildNumber) {
    console.info('No build number provided')
  }
  console.info('package.json version =', packageVersion)
  console.info('Final build version =', version)

  const versionObject = {
    version,
    packageVersion,
    buildNumber,
  }

  const githubOutput = process.env.GITHUB_OUTPUT

  if (!githubOutput) {
    throw new Error('No env var GITHUB_OUTPUT')
  }

  await appendFile(githubOutput, `VERSION="${version}"\n`)

  const versionJsonPath = join(__dirname, '../../src/version.json')

  await writeFile(versionJsonPath, JSON.stringify(versionObject))
}
