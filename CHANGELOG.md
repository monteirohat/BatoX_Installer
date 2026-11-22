# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.2.0] - 2026-11-22

### Added

- Windows: a Microsoft Store package (`.appx`), built with each release, with the app's tiles
  and the Store identity of the BatoX Install product.

## [1.1.1] - 2026-11-22

### Fixed

- macOS: the app is signed (ad hoc), so macOS no longer calls it "damaged" and refuses to open
  it. It isn't notarized by Apple, so the first launch still asks to allow it in System Settings
  > Privacy & Security (see the README).

## [1.1.0] - 2026-11-22

### Changed

- A new look, the one of the BatoX web app and of
  [batox-theme](https://github.com/monteirohat/batox-theme): dark indigo surfaces over a sunset
  picture, square corners, white type with titles in Inter Light, and a white frame on what is
  selected or done (a finished step, the chosen option, the main button) in place of the blue.
  The progress bars are thin white lines, as on the theme's loading screen.
- A new logo and app icon: "BatoX" in a pink script. Inter ships with the installer.

## [1.0.1] - 2026-10-29

### Fixed

- Linux: the app icon now shows in the app menu, the dock and the window title bar, instead of
  a generic icon. The package ships the icon in every standard size, and the window sets it
  explicitly.

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

[Unreleased]: https://github.com/monteirohat/BatoX_Installer/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/monteirohat/BatoX_Installer/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/monteirohat/BatoX_Installer/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/monteirohat/BatoX_Installer/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/monteirohat/BatoX_Installer/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/monteirohat/BatoX_Installer/releases/tag/v1.0.0
