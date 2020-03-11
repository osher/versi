# Versi - a ci tool to manage automatic bumps versions of node-packages

## The probelm
Given that:
- npm registry requires versions to be ***immutable***:
- trying to publish same version a 2nd time results with an error.
- `npm publish` uses the `version` it finds in the `package.json`

Then
- a build that should end with `npm publish` will ***fail*** unless the developers have bumped the version in their `package.json` file.

## The solution

There are two approaches, pending the organization culture.

### manual oversight
 > if the current version is occupied - it should not be published.
 > if the developers means to publish a new version - she should have the version bumped.

If this is your approach - this package is not for you.

### automatic updates
 > if changes were made and all tests have passed - I would like a new version to be published.

In this case, all you have to do is run `versi` as part of your ci.
You can do it either in your project root, or provide it with `-p/--path` to the `package.json` you need it's version to be updated, and `versi` will fix the version for you (explained better in *How it works* section below).

## Adhering to Semver and recommended workflow
 - developers must update manually the minor or major parts of his version whenever they add functionality or breack compatibility (respectively).
 - whenever no new functionality is added and all changes are backward compatible - the increase of the patch part can be done in-build automatically.

This means, that the following workflow is the recommended workflow with `versi`:
 - `version` in `package.json` are commited with `0` for patch (although developers can force a jump by commiting a patch number higher than last published).
 - `versi` is run in build before `npm publish` and is responsible to promote patch segment, relaying on what versions are published.
 - developers are responsible to promote `major` and `minor` parts in `package.json`

## installation

Two options:

### as part of your package

```
npm i versi -D
```

Then, ran from your npm hooks, e.g:

```
  "scripts": {
    //...
    "prepublish": "versi"
    //...
  }
```

### on yor build workers

```
npm i versi -g
```

The advantage here is that you can run it immediately after your checkout phase, and use the worked version in your build output.



## How it works
1. find your `package.json` file, or fail with an error.
2. extract `name` and `version` from your `package.json`, and parse it's `version` field
3. find the published version for your package, using the `npm` client found locally.
4. select the published versions which begin with the same major and minor as the version in your `package.json` file.
5. use the version from your `package.json` file when:
    - there are no published versions with same major and minor (i.e - developer updated it manually to communicate `semver` sematics)
    - the patch in `package.json` is higher than last published versions (i.e - developer updated it manually)
6. otherwise - increases the latest published version with same major and minor parts, and uses that as the next version.
7. update the package.json by replacing the version field
8. prints the updated package file, the version in package.json when the tool loaded, and the next version updated. e.g:
```
     { packageFile: '/home/usr/versi/test/fixtures/package1/package.json',
       foundVersion: '1.2.0',
       nextVersion: '1.2.17' }
```

**Note:** currently, prerelease versions are not supported. We may support it in a future version.

## Features
- uses the npm client installed on your build agent, and therefore, supports `.npmrc` and local npm-client users setup on your build agents.
- the vanilla run works on the `package.json` in current directory
- can accept path via CLI argument `-p/--path` as absolute or relative to `pwd`.
- ATM - it's slim and minimal (depends only on `minimist` and `semver`)

## Future
- implement CLI args to support workflow of pre-release increments - e.g. - based on branches.

## Lisence
- MIT and that's it :)