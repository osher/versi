module.exports = ({
  process = global.process,
  args: {
    packageFile,
    pkg,
  } = require('./args')({process}),
  fs = require('fs'),
  util: { promisify } = require('util'),
  childProcess = require('child_process'),
  semver: { parse } = require('semver'),
  debug = require('debug'),
}) => {
  return {
    run: async () => {
      const versions = await getPublishedVersions(pkg.name);
      const map = mapVersions(versions);
      const nextVersion = nextFreeVersion(pkg.version, map)
      const foundVersion = await updatePackageJson(packageFile, nextVersion)
      return { packageFile, foundVersion, nextVersion };
    },
    //expose for tests:
    getPublishedVersions,
    mapVersions,
    nextFreeVersion,
    updatePackageJson,
  }

  async function updatePackageJson(path, nextVersion) {
    const str = await promisify(fs.readFile)(path);
    let oldVersion = 'N/A';
    const replaced = str.toString().replace(/"version":(\s*)"([^""]+)"/, (_, spaces, oldVal) => {
      debug('versi:replacer')("replacing", { oldVal, nextVersion })
      oldVersion = oldVal;
      return `"version":${spaces}"${nextVersion}"`;
    })

    await promisify(fs.writeFile)(path, replaced)
    return oldVersion;
  }

  function nextFreeVersion(versionStr, map) {
    const parsed = parse(versionStr);

    const majMin = verKey(parsed);
    const versions = map[majMin];

    if (!versions || !versions.length) return parsed.toString();

    const last = versions.pop();
    const patch = last >= parsed.patch
      ? 1 + last
      : parsed.patch

    return `${parsed.major}.${parsed.minor}.${patch}`;
  }

  function verKey(parsed) {
    return parsed.major + "." + parsed.minor
  }

  function mapVersions(versions) {
    const mapped =  versions.reduce( (map, version) => {
      const parsed = parse(version)
      const majMin = verKey(parsed);
      if (!map[majMin]) map[majMin] = [];
      map[majMin].push( parsed.patch );
      map[majMin].sort((a,b) => a -b);
      return map
    }, {})
    debug('versi:mapVersions')({ versions, mapped })
    return mapped
  }

  async function getPublishedVersions(name) {
    const cmd = `npm info --silent --json ${name} versions`
    debug('versi:getPublishedVersions', {cmd});
    const { stdout:out } = await promisify(childProcess.exec)(cmd).catch(e => e);
    let result;

    try {
        result = JSON.parse(out);
    } catch(e) {
        console.error('could not parse npm response', { stdout: out })
        e.stdout = out;
        throw e;
    }

    debug('versi:getPublishedVersions')('result', name, { result });

    if (Array.isArray(result)) return result;

    if (result.error.code == 'E404') return [];

    throw Object.assign(new Error("could not get versions"), result.error)
  }
}
