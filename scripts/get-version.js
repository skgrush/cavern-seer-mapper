
if (require.main === module) {
  main()
}

/**
 * Write the package version to stdout.
 */
function main() {
  const version = getVersion()

  process.stdout.write(version)

  process.exit(0)
}


/**
 * Return the version string from package.json
 */
function getVersion() {
  const packageJson = require('../package.json')

  return packageJson.version
}
exports.getVersion = getVersion
