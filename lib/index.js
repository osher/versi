module.exports = ({
  process = global.process,
  args: {
    packageFile,
    pkg,
    prerelease,
  } = require('./args')({process}),
  fs = require('fs'),
  util: { promisify } = require('util'),
  childProcess = require('child_process'),
  semver: { parse } = require('semver'),
  debug = require('debug'),
}) => {
  return {
    run: async () => {
      const currentVersion = getCurrentVersion(pkg, prerelease);
      const publishedVersions = await getPublishedVersions(pkg.name);
      const versions = relevantVersions(publishedVersions, currentVersion)
      const nextSemver =
        currentVersion.prerelease.length
        ? nextFreeRelease(currentVersion, versions)
        : nextFreePrerelease(currentVersion, versions);
      const nextVersion = nextSemver.toString();
      const foundVersion = await updatePackageJson(packageFile, nextVersion);
      return { packageFile, foundVersion, nextVersion };
    },
    //expose for tests:
    getCurrentVersion,
    getPublishedVersions,
    relevantVersions,
    nextFreeRelease,
    nextFreePrerelease,
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

  function nextFreeRelease(currentVersion, versions) {
    if (
      !versions.length //new maj/min range
      || !versions.find(itr => 1 !== currentVersion.compare(itr)) //pkg.json is higher
    ) return currentVersion;

    return versions.sort((a, b) => a.compare(b)).pop().inc('patch');
  }

  function nextFreePrerelease(currentVersion, versions) {
    if (
      !versions.length //new maj/min/patch-pre range
      || !versions.find(itr => 1 !== currentVersion.compare(itr)) //pkg.json is higher
    ) return currentVersion;

    return versions.sort((a, b) => a.compare(b)).pop().inc('prerelease');
  }

  function relevantVersions(versions, currentVersion) {
      const { major, minor, patch, prerelease } = currentVersion;

      versions = versions.map(v => parse(v));

      if (!prerelease.length) {
        return versions.filter(itr =>
          itr.major === major
          && itr.minor === minor
          && !itr.prerelease.length
        );
      }

      if ('number' == typeof prerelease[prerelease.length -1]) prerelease.pop();
      const prereleaseStr = String(prerelease);

      return versions.filter(itr => {
        const prerelease = itr.prerelease.concat();
        if ('number' == typeof prerelease[prerelease.length -1]) prerelease.pop();
        return itr.prerelease.length
            && itr.major === major
            && itr.minor === minor
            && itr.patch === patch
            && String(prerelease) === prereleaseStr;
      });
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

  function getCurrentVersion(pkg, prerelease) {
    const versionStr = prerelease ? `${pkg.version.replace(/-.*$/,'')}-${prerelease}` : pkg.version;
    return parse(versionStr);
  }
}
