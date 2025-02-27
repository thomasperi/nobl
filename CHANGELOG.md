# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [Unreleased]

### Fixed

- Added missing `import` statement in README.


## [1.0.0-alpha.7] - 2025-01-28

### Added

- npm `prepack` script

### Changed

- `nobl` function instead of `Nobl` class
- Renamed files with lowercase n

### Removed

- Unnecessary methods


## [1.0.0-alpha.6] - 2024-12-29

### Fixed

- Forgot to build the last release!


## [1.0.0-alpha.5] - 2024-12-29

### Changed

- Renamed `start` to `run` for consistency with `running` property
- Changed `run` method to accept iterators directly (i.e., not just generator functions), to allow passing arguments to external generator functions


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


[unreleased]: https://github.com/thomasperi/nobl/compare/v1.0.0-alpha.7...HEAD
[1.0.0-alpha.7]: https://github.com/thomasperi/nobl/compare/v1.0.0-alpha.6...v1.0.0-alpha.7
[1.0.0-alpha.6]: https://github.com/thomasperi/nobl/compare/v1.0.0-alpha.5...v1.0.0-alpha.6
[1.0.0-alpha.5]: https://github.com/thomasperi/nobl/compare/v1.0.0-alpha.4...v1.0.0-alpha.5
[1.0.0-alpha.4]: https://github.com/thomasperi/nobl/compare/v1.0.0-alpha.3...v1.0.0-alpha.4
[1.0.0-alpha.3]: https://github.com/thomasperi/nobl/compare/v1.0.0-alpha.2...v1.0.0-alpha.3
[1.0.0-alpha.2]: https://github.com/thomasperi/nobl/compare/v1.0.0-alpha.1...v1.0.0-alpha.2
[1.0.0-alpha.1]: https://github.com/thomasperi/nobl/releases/tag/v1.0.0-alpha.1
