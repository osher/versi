require('../lib')({
  process,
  /*args: {
    packageFile: './test/fixtures/package1/package.json',
    pkg: {
      name: "@playbuzz/playbuzz-config",
      version: "1.2.0",
    }
  }*/
})
.run()
.then(console.log)
.catch(e => {
  console.error(e);
  process.exit(1);
})