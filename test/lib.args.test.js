const SUT = require('../lib/args');

describe('lib/args', () => {
  it('should be a factory function that expects options', () => {
    Should(SUT).be.a.Function().have.property('length', 1)
  });

  describe("when used")
});
