const childProcess = require('child_process');
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
        }
      }
    })
  });

  describe(".mapVersions(versions)", () => {
    describe("when called with", () => {
      [{ 
        title: "a single version - should be mapped to a single key",
        versions: [ "1.0.0" ],
        expect: { "1.0": [0] }
      }, { 
        title: "a many versions of few major-minor pairs - should map per major-minor key, sorted",
        versions: [ "1.0.0", "1.0.1", "1.0.2", "1.1.1", "1.1.0", "1.2.4", , "1.2.3" ],
        expect: { 
          "1.0": [0, 1, 2],
          "1.1": [0,1],
          "1.2": [3,4],
        }
      }, {
        title: "many versions from same maj-min",
        versions: [ '1.0.0',
          '1.0.1',
          '1.0.2',
          '1.0.3',
          '1.0.4',
          '1.0.5',
          '1.0.6',
          '1.0.7',
          '1.0.8',
          '1.0.9',
          '1.0.10',
          '1.0.11',
          '1.0.12'
        ],
        expect: {
          "1.0": [0,1,2,3,4,5,6,7,8,9,10,11,12]
        },      
      }].forEach(({ title, versions, expect}) => {
        it(title, () => {
          Should(instance.mapVersions(versions)).eql(expect);
        });
      })
    });
  });
  describe(".nextFreeVersion(verStr, map)", () => {
    [{
      title: 'when package.json expresses a new range',
      then: 'should use version from package',
      map: {
        '1.1': [0,1,2,3],
        '1.2': [0,1,2], 
        '1.3': [0,1,2],
      },
      verStr: "1.4.4", //<-- not in map
      expect: "1.4.4"
    }, {
      title: 'when package.json is bigger than last published version',
      then: 'should use version from package',
      map: {
        '1.1': [0,1,2,3],
        '1.2': [0,1,2], //<----- smaller
        '1.3': [0,1,2],
      },
      verStr: "1.2.3", // <--- bigger
      expect: "1.2.3"
    }, {
      title: 'when package.json is equal to last published version',
      then: 'should use incremented last version',
      map: {
        '1.1': [0,1,2,3],
        '1.2': [0,1,2], //<----- equal
        '1.3': [0,1,2],
      },
      verStr: "1.2.2", //<----- equal
      expect: "1.2.3"
    }, {
      title: 'when package.json is smaller than last published version',
      then: 'should use incremented last version',
      map: {
        '1.1': [0,1,2,3],
        '1.2': [0,1,2], //<----- bigger
        '1.3': [0,1,2],
      },
      verStr: "1.2.0", //<--- smaller
      expect: "1.2.3"
    }].forEach(({title, then, map, verStr, expect}) => {
      describe(title, () => {
        it(then, () => {
          const found = instance.nextFreeVersion(verStr, map)
          Should(found).eql(expect);
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
  });
});