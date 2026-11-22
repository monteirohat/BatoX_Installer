# BatoX Install – Privacy Policy

Last updated: November 22, 2026

BatoX Install (the BatoX Installer) installs BatoX, a free and open-source web app, on a Batocera
console on your local network. This policy explains what the installer does with your
information.

## What the installer does not do

- It has no account, no sign-in and no ads.
- It does not collect analytics, telemetry or crash reports.
- It does not send any information about you or your computer to the BatoX project.

## Connections it makes

- **GitHub** (api.github.com and github.com): to list the available BatoX versions and download
  the one you choose. These requests carry no personal information, but like any website, GitHub
  can see your IP address. GitHub's privacy statement applies:
  <https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement>
- **Your console**: the installer connects over SSH, on your local network, to the address you
  type. It uses the user name and password you enter to copy BatoX to the console and start it.
  This connection goes straight from your computer to your console and does not go through the
  internet.

## What it keeps on your computer

- The console's address, user name and SSH port, so you don't have to type them again next time.
  The password is never saved.
- The BatoX files it downloaded, so a reinstall doesn't download them again.

All of this stays on your computer and goes away when you uninstall the app.

## The access token

At the end of the installation, the installer reads BatoX's access token from your console and
shows it to you. It copies the token to your clipboard only when you choose "Copy token". It does
not save the token or send it anywhere.

## Links

Buttons such as "Open BatoX" and the release notes open in your web browser. What happens on those
pages is up to the sites themselves.

## Microsoft Store

If you installed the app from the Microsoft Store, Microsoft may collect information under its own
privacy statement: <https://privacy.microsoft.com/privacystatement>

## Children

The installer does not collect personal information from anyone, children included.

## Changes

If this policy changes, the new version will be published here and with the app's next update,
with a new date above.

## Contact

For questions about this policy, open an issue at
<https://github.com/monteirohat/BatoX_Installer/issues>.
