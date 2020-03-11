Promise.resolve()
.then(() => require('../lib')({}).run())
.then(result => console.log(JSON.stringify(result, null, 2)))
.catch(e => {
  console.error(e);
  process.exit(1);
})