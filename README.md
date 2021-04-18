<!-- Copyright 2014-2020 Signal Messenger, LLC -->
<!-- SPDX-License-Identifier: AGPL-3.0-only -->

# Signal Desktop

**REGISTERING A NEW DEVICE WILL DELETE THE OLD ACCOUNT ASSOCIATED WITH THE NUMBER**

This Signal Desktop fork can be used without a smartphone.

---

This is a hobby project and I am no frontend developer nor a security expert in any way. Nevertheless I am using this fork myself and am trying to keep it up to date with the upstream master branch. This project can not be considered finished, but a minimal usage is covered. Here is a brief overview about what is currently possible:

### Features

- Register Signal-Desktop as a standalone device.
  - This option is part of the official Signal-Desktop (only in development mode) and can therefore be considered rather stable
- Changing a contact's name
- Linking a secondary Signal-Desktop instance to the primary one
- One-Way Synchronization accross multiple devices. This is similar to the synchronization mechanism between Signal-Android/iOS and Signal-Desktop.
  - Any changes made in the secondary devices will be overwritten upon next synchronization
- Changing privacy settings
  - Read Receipts
  - Unidentified Delivery Indicators
  - Typing Indicators
  - Link Previews

## Got a question?

You can find answers to a number of frequently asked questions on our [support site](https://support.signal.org/).
The [community forum](https://community.signalusers.org/) is another good place for questions.

## Found a Bug?

Please search for any [existing issues](https://github.com/claasklar/Signal-Desktop/issues) that describe your bug in order to avoid duplicate submissions.

## Have a feature request, question, comment?

Please use our community forum: https://community.signalusers.org/

## Contributing Code

Please see [CONTRIBUTING.md](https://github.com/claasklar/Signal-Desktop/blob/standalone/CONTRIBUTING.md)
for setup instructions and guidelines for new contributors.

## Cryptography Notice

This distribution includes cryptographic software. The country in which you currently reside may have restrictions on the import, possession, use, and/or re-export to another country, of encryption software.
BEFORE using any encryption software, please check your country's laws, regulations and policies concerning the import, possession, or use, and re-export of encryption software, to see if this is permitted.
See <http://www.wassenaar.org/> for more information.

The U.S. Government Department of Commerce, Bureau of Industry and Security (BIS), has classified this software as Export Commodity Control Number (ECCN) 5D002.C.1, which includes information security software using or performing cryptographic functions with asymmetric algorithms.
The form and manner of this distribution makes it eligible for export under the License Exception ENC Technology Software Unrestricted (TSU) exception (see the BIS Export Administration Regulations, Section 740.13) for both object code and source code.

## License

Copyright 2013–2021 Signal, a 501c3 nonprofit

Licensed under the AGPLv3: https://opensource.org/licenses/agpl-3.0
