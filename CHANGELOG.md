# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.0.0] - 2026-10-29

### Added

- Three-step installer, in the style of balenaEtcher: version, console, install.
- Downloads the latest BatoX release from GitHub, or a version picked from the list or typed by tag.
- Checks the console over SSH: Batocera v38+, processor (Raspberry Pi/ARM 64-bit or x86_64) and
  the BatoX version already installed.
- Verifies the download against the release's SHA256SUMS.
- Installs or updates BatoX, migrating an existing MyMine install, starts the service and tests
  the API.
- Shows the BatoX address and API token at the end, with buttons to open and copy them.
- Builds for Windows (installer and portable), macOS (dmg) and Linux (AppImage and deb).

[Unreleased]: https://github.com/monteirohat/BatoX_Installer/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/monteirohat/BatoX_Installer/releases/tag/v1.0.0
