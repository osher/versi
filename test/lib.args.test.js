const path = require('path');
const Should = require('should');
const SUT = require('../lib/args');

const cwdFile = file => path.join(process.cwd(), file);
const myPackageFile = cwdFile('package.json')
const myPkg = require('../package');
const pkg1 = require('./fixtures/package1/package');

describe('lib/args', () => {
  it('should be a factory function that expects options', () => {
    Should(SUT).be.a.Function().have.property('length', 1)
  });

  describe("when called", () => {
    [{
      title: "vanilla run - should assume package.json in current directory",
      process: {
        cwd: () => process.cwd(),
        argv: [],
      },
      expect: {
        packageFile: myPackageFile,
        pkgName: myPkg.name,
        pkgVersion: myPkg.version,
      },
    }, {
      title: "vanilla run, with no package.json in current directory - should end with error",
      process: {
        cwd: () => '/',
        argv: [],
      },
      expect: {
        errMsg: /cannot find module/i,
      },
    }, {
      title: "provided --path with file-not-found - should end with error",
      process: {
        cwd: () => '/',
        argv: ['node', 'cli.js', '--path', '/no/such/package.json'],
      },
      expect: {
        errMsg: /cannot find module/i,
      },
    }, {
      title: "provided --path with an existing package.json - should load it well",
      process: {
        cwd: () => '/',
        argv: ['node', 'cli.js', '--path', 'test/fixtures/package1/package.json'],
      },
      expect: {
        packageFile: cwdFile('test/fixtures/package1/package.json'),
        pkgName: pkg1.name,
        pkgVersion: pkg1.version,
      },
    }, {
      title: "provided --prerelease - should contain the passed prerelease value",
      process: {
        cwd: () => '/',
        argv: ['node', 'cli.js', '--path', 'test/fixtures/package1/package.json', '--prerelease', 'alpha'],
      },
      expect: {
        packageFile: cwdFile('test/fixtures/package1/package.json'),
        pkgName: pkg1.name,
        pkgVersion: pkg1.version,
        ignorePrerelease: true,
      },
    }, {
      title: "provided -t - should contain the passed prerelease value",
      process: {
        cwd: () => '/',
        argv: ['node', 'cli.js', '--path', 'test/fixtures/package1/package.json', '-t', 'beta'],
      },
      expect: {
        packageFile: cwdFile('test/fixtures/package1/package.json'),
        pkgName: pkg1.name,
        pkgVersion: pkg1.version,
        prerelease: 'beta',
      },
    }, {
      title: "provided -t with characters illegal for semver tag - should contain the sanitized value",
      process: {
        cwd: () => '/',
        argv: ['node', 'cli.js', '--path', 'test/fixtures/package1/package.json', '-t', 'feat/port-8080'],
      },
      expect: {
        packageFile: cwdFile('test/fixtures/package1/package.json'),
        pkgName: pkg1.name,
        pkgVersion: pkg1.version,
        prerelease: 'feat_port-8080',
      },
    }].forEach(({ title, process, expect: {
      packageFile, pkgName, pkgVersion, prerelease, errMsg
    }}) => {
      describe(title, () => {
        let result, err;
        before(() => {
          try {
            result = SUT({process});
          } catch(e) {
            err = e;
          }
        });

        if (errMsg) {
          it('should end with error', () => {
            Should(err).have.property('message').match(errMsg);
          });
          return;
        }

        it('sould not fail', () => {
          if (err) throw err;
        });

        describe("the returned args", () => {
          it('should support alias -p/--path', () => {
            Should(result.p).equal(result.path);
          });

          packageFile && it('should include .packageFile:  ' + packageFile, () => {
            Should(result).have.property('packageFile', packageFile);
          });

          pkgName && it('should include .pkg.name: ' + pkgName, () => {
            Should(result).have.property('pkg').property('name', pkgName);
          });

          pkgVersion && it('should include .pkg.version: ' + pkgVersion, () => {
            Should(result).have.property('pkg').property('version', pkgVersion);
          });

          prerelease && it('should include .prerelease: ' + prerelease, () => {
            Should(result).have.property('prerelease', prerelease);
          });
        });
      });
    });
  })
});
