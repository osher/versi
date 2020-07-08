module.exports = ({
  process,
  path = require('path'),
  minimist = require('minimist'),
  debug = require('debug')('versi:args'),
  loadPackageFile = require,
}) => {
  const raw = minimist(process.argv.slice(2), {
    alias: { p: "path", t: "prerelease-tag" },
    default: { p: path.join(process.cwd(), 'package.json') },
  });

  debug('raw', raw);
  const args = {
    packageFile: path.resolve(raw.path),
    prerelease: raw.t && String(raw.t).replace(/[^a-z0-9.-]/gi,'_'),
  };
  args.pkg = Object.assign(loadPackageFile(args.packageFile), raw.pkg);

  debug('final', args);
  return args
}
