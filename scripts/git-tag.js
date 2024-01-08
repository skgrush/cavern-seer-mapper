const { spawnSync } = require('child_process')

/**
 * @param {string} tagOrPattern
 * @returns {string[]} the matching tags
 */
exports.versionTagExists = function versionTagExists(tagOrPattern) {
  const {
    stdout,
  } = spawnSync('git tag', ['-l', tagOrPattern], {
    encoding: 'utf8',
    shell: true,
  })

  const tags = stdout.split('\n')

  return tags.filter(str => !!str)
}
