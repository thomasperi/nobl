# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [Unreleased]

### Changed

- Renamed `start` to `run` for consistency with `running` property
- Changed `run` method to accept iterators directly (i.e., not just generator functions), to allow passing arguments to external generator functions

### Added

- Added `await` to sample code in README to indicate that `.start` returns a promise

### Fixed

- Typo in README


## [1.0.0-alpha.4] - 2024-12-28

### Added

- Some silly terser optimizations

### Changed

- Standardized the error messages

### Removed

- Unnecessary check for unreachable state

### Fixed

- Fixed bug in sample code in README
- Solved 'No "exports" main defined' problem by adding in "exports" -> "." -> "default" option in package.json
- Fixed a discrepancy with internal duration values


## [1.0.0-alpha.3] - 2024-12-27

### Added

- Changelog
- Github repo in `package.json`
- `files` field in `package.json`

### Fixed

- Linebreak problem in README


## [1.0.0-alpha.2] - 2024-12-27

### Fixed

- Weird `package.json` problem


## [1.0.0-alpha.1] - 2024-12-27

- First publish


[unreleased]: https://github.com/thomasperi/nobl/compare/v1.0.0-alpha.4...HEAD
[1.0.0-alpha.4]: https://github.com/thomasperi/nobl/compare/v1.0.0-alpha.3...v1.0.0-alpha.4
[1.0.0-alpha.3]: https://github.com/thomasperi/nobl/compare/v1.0.0-alpha.2...v1.0.0-alpha.3
[1.0.0-alpha.2]: https://github.com/thomasperi/nobl/compare/v1.0.0-alpha.1...v1.0.0-alpha.2
[1.0.0-alpha.1]: https://github.com/thomasperi/nobl/releases/tag/v1.0.0-alpha.1
