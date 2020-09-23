# Versi - a ci tool to manage automatic bumps for node-packages versions
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fosher%2Fversi.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fosher%2Fversi?ref=badge_shield)


[![Known Vulnerabilities](https://snyk.io/test/github/osher/versi/badge.svg?targetFile=package.json)](https://snyk.io/test/github/osher/versi?targetFile=package.json)

## The probelm
Given that:
- npm registry requires versions to be ***immutable***:
- trying to publish same version a 2nd time results with an error.
- `npm publish` uses the `version` it finds in the `package.json`

Then
- a build that should end with `npm publish` will ***fail*** - unless developers have bumped the version in their `package.json` file.

## The solution

There are two approaches, pending the organization culture.

### manual oversight
 > if the current version is occupied - it should not be published.
 > if developers mean to publish a new version - they should have the version bumped.

If this is your approach - this package is not for your current project.

### automatic updates
 > if changes were made and all tests have passed - I would like a new version to be published.

In this case, all you have to do is run `versi` as part of your CI.
You can do it either in your project root, or provide it with `-p/--path` to the `package.json` you need it's version updated, and `versi` will fix the version for you (explained better in *How it works* section below).

## Adhering to Semver and recommended workflow
 - developers must update manually the minor semver segment whenever they add functionality, and the major semver segment whenver they breack compatibility.
 - whenever no new functionality is added and all changes are backward compatible - the increase of the patch part can be done in-build automatically.

This means, that the following workflow is the recommended workflow with `versi`:
 - `version` in `package.json` are commited with `0` for patch (although developers can force a jump by commiting a patch number higher than last published).
 - `versi` is run in build before `npm publish` and is responsible to promote patch segment, relaying on what versions are published on the npm registry.
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

The advantage here is that you can run it immediately after your checkout phase, and use the worked version in your build output and side effects.

e.g. see it early in build log, set build-name even if your did not get to the publish stage(Jenkins/blue-ocean)

## Features
- uses the npm client installed on your build agent, and therefore, supports `.npmrc` and/or local npm-client users setup on your build agents.
- the vanilla run works on the `package.json` in current directory
- supports path injection via CLI argument `-p/--path` as absolute or relative to `pwd`, to the directory where target  `package.json` should be found.
- supports a prerelease mode - pass the prerelease tag using `-l/prerelease` CLI switch
- ATM - it's slim and minimal (depends only on `minimist`, `semver` and `debug`)

## How it works
1. find the target `package.json` file, or fail with an error.
2. extract `name` and `version` from the target `package.json`, and parse it's `version` field usign `semver`
3. find the published versions for your package, using the `npm` client found locally (or fail with error).
4. compute the next available version using the version from the `package.json` file and the versions returned by npm.
   This is done in either `release` mode, or in `pre-release` mode - find the details below.
5. update the package.json by replacing the version field using string manipulation - i.e - original file indentations are preserved.
6. prints a summary with:
   - the path to the updated `package.json` file,
   - the version in `package.json` when the tool loaded,
   - and the version it has ended with.

   e.g:
    ```
         {
           "packageFile": "/home/usr/versi/test/fixtures/package1/package.json",
           "foundVersion": "1.2.0",
           "nextVersion": "1.2.17"
         }
    ```

### release mode
This mode assures that the end result is a clean semver version, includes only major, minor and patch.

e.g.: `"2.3.1"`, `"1.0.5"`, `0.8.4`

This mode is used when no prerelease tag is found in both the `package.json`, nor in a `-t/--prerelease-tag` CLI switch.

The algorithm in this case is:
 1. filter from all published versions all versions that start with the same major and minor.
 2. Use the version from package.json in any of the following cases:
    - no versions pass the filter - (this is the case of a new major/minor pair)
    - the version from `package.json` is higher by semver rules than any of the filtered versions
      (this is a case of a jump in the running patch number imposed by developers).
 3. Otherwise - take the latest by semver rules, and increase it's patch by one - and return that as the new version.

### prerelease mode
This mode publishes a *prerelease* version - i.e - a version that includes a prerelease semver tag.

Package users will not get this versions unless they ask for them _*explicitly*_.

e.g.: `"2.3.1-feat_users-api"`, `"1.0.5-beta.3"`, `0.8.4-chore_refactor-for-resilience.12`

This mode is used when a semver prerelease tag is found in either the `package.json`, or in the `-t/--prerelease-tag` CLI switch provided.

Notes:
 - When both the tool and the `package.json` contain a prerelease tag value - the CLI switch cascades.
 - the tool knows to distinct the running number in the end of the prerelease tag when such number is found.
   If no prerelease running number is found in a version selected for incrementation - it will be added as 0, which complies with semver rules.
 - when the passed prerelease tag contains characters unfit for preerelease tag (e.g. a name of a branch with slash inside) - it is sanitized by replacing any non `[a-zA-Z0-9.-]` with underscore.

The algorithm in this case is:
 1. filter from all published versions all versions that start with the same major and minor, patch and prerelease, not including the optional running number in the end of the tag.
 2. Use the version from package.json in any of the following cases:
    - no versions pass the filter (this is the case of a new tag)
    - the version from `package.json` is higher by semver rules than any of the filtered versions
      (this is a case of a jump in the running number imposed by developers).
 3. Otherwise - take the latest by semver rules, and increase it's tag's running numeric number - and return that as the new version.

## Future
- travis & coveralls integration based on in-build env vars

## Debug
```
DEBUG=versi:* versi
```

## Test
```
npm run test
```

## Lisence
- [**ISC**](https://choosealicense.com/licenses/isc/)
   - you may do with the source code anything you like
   - there is no warranty on our end


## License
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fosher%2Fversi.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Fosher%2Fversi?ref=badge_large)