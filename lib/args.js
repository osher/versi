module.exports = ({
  process,
  path = require('path'),
  minimist = require('minimist'),
  debug = require('debug')('versi:args'),
  loadPackageFile = require,
}) => {
  const args = minimist(process.argv.slice(2), {
    alias: { p: "path" },
    default: { p: path.join(process.cwd(), 'package.json') },
  });
  debug('raw', args);
  args.packageFile = path.resolve(args.path);
  args.pkg = Object.assign(loadPackageFile(args.packageFile), args.pkg)
  debug('final', args);
  return args
}