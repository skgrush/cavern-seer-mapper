const { versionTagExists } = require('../git-tag')


if (require.main === module) {
  main()
}

function main() {
  const arg2 = process.argv[2]

  if (!arg2) {
    console.error('Must pass a version string as an argument or --current')
    return process.exit(255)
  }

  /** @type string */
  let version
  if (arg2 === '--current') {
    version = 'v' + require('../../package.json').version
  }
  else if (arg2.startsWith('v')) {
    version = arg2
  }
  else {
    version = `v${arg2}`
  }

  console.info('Checking against pattern:', version)
  const matches = versionTagExists(version)
  console.info('matching tags:', matches)

  const exists = !!matches.length

  if (exists) {
    console.error('Error: Found a matching tag for', version)
    process.exit(1)
  }

  process.exit(0)
}
