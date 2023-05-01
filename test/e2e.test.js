const { exec } = require('child_process');
const Should = require('should');

describe("e2e test", () => {
  describe('vanilla run', () => {
    const ctx = {}
    before(function(done) {
      this.timeout(5000)
      exec('node bin/cli', (ex, out, err) => {
        Object.assign(ctx, { ex, out, err})
        done()
      });
    });
    it('should not fail', () => Should.not.exist(ctx.ex));
    it('should emit JSON output with packageFile, foundVersion and nextVersion', () => {
      Should(JSON.parse(ctx.out)).properties('packageFile', 'foundVersion', 'nextVersion');
    })
  });


  describe('providing non-existing path', () => {
    const ctx = {}
    before(function(done) {
      this.timeout(5000)
      exec('node bin/cli --path no/such/file', (ex, out, err) => {
        Object.assign(ctx, { ex, out, err})
        done()
      });
    });
    it('should end with error', () => Should(ctx.ex).be.an.Error())
  });

  describe('providing existing path to an unpublished new package', () => {
    const ctx = {}
    before(function(done) {
      this.timeout(5000)
      exec('node bin/cli --path test/fixtures/no-such-package-wtf-who-calls-a-package-with-such-name/package.json', (ex, out, err) => {
        Object.assign(ctx, { ex, out, err})
        done()
      });
    });
    it('should not fail', () => Should.not.exist(ctx.ex));
    it('should emit JSON output with packageFile, foundVersion and nextVersion', () => {
      Should(JSON.parse(ctx.out)).properties('packageFile', 'foundVersion', 'nextVersion');
    })
  });

  describe('providing existing path to an unpublished new package with prerelease tag', () => {
    const ctx = {}
    before(function(done) {
      this.timeout(15000)
      exec('node bin/cli --path test/fixtures/no-such-package-wtf-who-calls-a-package-with-such-name--beta/package.json', (ex, out, err) => {
        Object.assign(ctx, { ex, out, err})
        done()
      });
    });
    it('should not fail', () => Should.not.exist(ctx.ex));
    it('should emit JSON output with packageFile, foundVersion and nextVersion', () => {
      Should(JSON.parse(ctx.out)).properties('packageFile', 'foundVersion', 'nextVersion');
    })
  });
});
