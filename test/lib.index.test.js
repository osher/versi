const childProcess = require('child_process');
const semver = require('semver');
const Should = require('should');
const SUT = require('../lib/index')

describe("main module (lib/index)", () => {
  it('should be a factory function that expects options', () => {
    Should(SUT).be.a.Function().have.property('length', 1)
  });
  let instance;

  before(() => {
    instance = SUT({
      args: {
        pkg: {
          name: "@playbuzz/some-package",
          version: "1.1.0",
        },
      }
    })
  });
  describe('.getCurrentVersion(pkg, prerelease)', () => {
    [{
      title: 'pacakge with release version, no cli prerelease switch',
      then: 'return package version as is',
      pkg: { version: '6.3.21' },
      //prerelease: undefined,
      expect: '6.3.21',
    }, {
      title: 'pacakge with pre-release version, no cli prerelease switch',
      then: 'return package version as is',
      pkg: { version: '6.3.22-beta.3' },
      //prerelease: undefined,
      expect: '6.3.22-beta.3',
    }, {
      title: 'pacakge with release version, cli prerelease switch passed',
      then: 'should augment the prerelease tag on the package version',
      pkg: { version: '6.3.22' },
      prerelease: 'beta.3',
      expect: '6.3.22-beta.3',
    }, {
      title: 'pacakge with pre-release version, cli prerelease switch passed',
      then: 'should augment the replace tag on the package version with the passed switch',
      pkg: { version: '6.3.22-alpha.1' },
      prerelease: 'beta',
      expect: '6.3.22-beta',
    }].forEach(({ title, then, pkg, prerelease, expect }) => {
      describe(title, () => {
        let found;
        before(() => {
          found = instance.getCurrentVersion(pkg, prerelease).toString();
        });
        it(then, () => {
          Should(found).eql(expect);
        });
      });
    });
  });

  describe('.relevantVersions(publishedVersions, currentVersion)', () => {
    [{
      title: 'current version with release version of a new maj/min range',
      then: 'should return empty list',
      versions: ['1.4.1', '1.4.2', '1.4.2-beta.1', '1.6.0'],
      current: '1.5.8',
      expect: [],
    }, {
      title: 'current version with release version of an existing maj/min range',
      then: 'should return only release versions to relevant maj/min range',
      versions: ['1.4.0', '1.4.1', '1.4.2', '1.4.2-beta.1', '1.6.0'],
      current: '1.4.0',
      expect: ['1.4.0', '1.4.1', '1.4.2'],
    }, {
      title: 'current version with prerelease version of a new tag',
      then: 'should return empty list',
      versions: ['1.4.1', '1.4.2', '1.4.2-alpha', '1.4.2-alpha.0', '1.4.2-alpha.1', '1.6.0'],
      current: '1.4.2-beta',
      expect: [],
    }, {
      title: 'current version with prerelease version of an existing tag, no running number',
      then: 'should return only release versions to relevant maj/min range',
      versions: ['1.4.1', '1.4.2', '1.4.2-alpha.0', '1.4.2-alpha.1', '1.4.2-beta', '1.4.2-beta.0', '1.6.0'],
      current: '1.4.2-beta',
      expect: ['1.4.2-beta', '1.4.2-beta.0'],
    }, {
      title: 'current version with release version of an existing tag, with running number',
      then: 'should return only release versions to relevant maj/min range',
      versions: ['1.4.1', '1.4.2', '1.4.2-alpha.0', '1.4.2-alpha.1', '1.4.2-beta', '1.4.2-beta.0', '1.6.0'],
      current: '1.4.2-beta.0',
      expect: ['1.4.2-beta', '1.4.2-beta.0'],
    }].forEach(({title, then, versions, current, expect }) => {
      describe(title, () => {
        let found;
        before(() => {
          found = instance.relevantVersions(versions, semver.parse(current)).map(v => v.toString());
        });
        it(then, () => Should(found).eql(expect));
      });
    });
  });

  describe(".nextFreeRelease(currentVersion, versions)", () => {
    [{
      title: 'when package.json expresses a new range',
      then: 'should use version from package',
      versions: [], //<-- empty!
      verStr: "1.4.4",
      expect: "1.4.4"
    }, {
      title: 'when package.json is bigger than last published version',
      then: 'should use version from package',
      versions: [ '1.2.0', '1.2.1', '1.2.2' ], //<----- smaller
      verStr: "1.2.3", // <--- bigger
      expect: "1.2.3"
    }, {
      title: 'when package.json is equal to last published version',
      then: 'should use incremented last version',
      versions: [ '1.2.0', '1.2.1', '1.2.2' ], //<----- equal
      verStr: "1.2.2", //<----- equal
      expect: "1.2.3"
    }, {
      title: 'when package.json is smaller than last published version',
      then: 'should use incremented last version',
      versions: [ '1.2.0', '1.2.1', '1.2.2' ], //<----- bigger
      verStr: "1.2.0", //<--- smaller
      expect: "1.2.3"
    }].forEach(({title, then, versions, verStr, expect}) => {
      describe(title, () => {
        it(then, () => {
          const found = instance.nextFreeRelease(semver.parse(verStr), versions.map(v => semver.parse(v)));
          Should(found.toString()).eql(expect);
        })
      })
    })
  });

  describe(".nextFreePrerelease(currentVersion, versions)", () => {
    [{
      title: 'when package.json expresses a new range',
      then: 'should use version from package',
      versions: [], //<-- empty!
      verStr: "1.4.4-beta.2",
      expect: "1.4.4-beta.2"
    }, {
      title: 'when package.json is bigger than last published version',
      then: 'should use version from package',
      versions: [ '1.2.1-beta.0', '1.2.1-beta.1', '1.2.1-beta.2' ], //<----- smaller
      verStr: "1.2.1-beta.3", // <--- bigger
      expect: "1.2.1-beta.3"
    }, {
      title: 'when package.json is equal to last published version',
      then: 'should use incremented last version',
      versions: [ '1.2.1-beta.0', '1.2.1-beta.1', '1.2.1-beta.2' ], //<----- equal
      verStr: "1.2.1-beta.2", //<----- equal
      expect: "1.2.1-beta.3"
    }, {
      title: 'when package.json is smaller than last published version',
      then: 'should use incremented last version',
      versions: [ '1.2.1-beta.0', '1.2.1-beta.1', '1.2.1-beta.2' ], //<----- bigger
      verStr: "1.2.1-beta.0", //<--- smaller
      expect: "1.2.1-beta.3"
    }].forEach(({title, then, versions, verStr, expect}) => {
      describe(title, () => {
        it(then, () => {
          const found = instance.nextFreePrerelease(semver.parse(verStr), versions.map(v => semver.parse(v)));
          Should(found.toString()).eql(expect);
        })
      })
    })
  });

  describe(".getPublishedVersions(name)", () => {
    describe("when `npm info` returns with an unexpected error", () => {
      const orig = childProcess.exec;
      const ctx = {};
      before(() => {
        childProcess.exec = (cmd, cb) => {
          process.nextTick(() => cb(null, {
            stdout: JSON.stringify({
              error: {
                code: 'not E 400 + 4',
                some: 'info',
                ofThe: 'error'
            }})
          }));
        };

        return instance
          .getPublishedVersions('some-name')
          .then(res => ctx.res = res)
          .catch(err => ctx.err = err)
      });
      after(() => childProcess.exec = orig);
      it("should output the error with any additional info", () => {
        Should(ctx.err).be.an.Error()
        .properties({
          code: 'not E 400 + 4',
          some: 'info',
          ofThe: 'error'
        })
      })
    });

    describe("when `npm info` returns with an unexpected error in non-json output", () => {
      const orig = childProcess.exec;
      const ctx = {};
      before(() => {
        childProcess.exec = (cmd, cb) => {
          process.nextTick(() => cb(null, {
            stdout: new Error('oups, I did it again').stack
          }));
        };

        return instance
          .getPublishedVersions('some-name')
          .then(res => ctx.res = res)
          .catch(err => ctx.err = err)
      });
      after(() => childProcess.exec = orig);
      it("should output the error with any additional info", () => {
        Should(ctx.err).be.an.Error()
            .properties(['stdout'])
            .property('stdout')
            .match(/Error: oups, I did it again/);
      });
    });
  });
});
