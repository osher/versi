0.7.0
 - Breaking Change:
   when a version is tagged with a prerelease-tag, it should not be considered taken.
   pass `-i/--include-prerelease` for the behavior of `0.6.x`, where versions published
   with pre-release tags were considerd taken.

# 0.6.x

0.6.6
 - fix - handle non-json response form npm versions
0.6.4
 - fix a bug in the versions sort

0.6.3
 - use ISC lisence
 - add CHANGELOG.md
 - readme updates

0.6.1-2
 - add `repository` field to package.json
 - add tests, implement coverage
 - readme updates

0.6.0
 - initial public release.
