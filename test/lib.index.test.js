const Should = require('should');
const SUT = require('../lib/index')

describe("main module (lib/index)", () => {
  it('should be a factory function that expects options', () => {
    Should(SUT).be.a.Function().have.property('length', 1)
  });


  describe(".nextFreeVersion(verStr, map)", () => {
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
});