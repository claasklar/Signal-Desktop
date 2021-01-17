// Copyright 2020 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

/* eslint-disable more/no-then */
/* eslint-disable max-classes-per-file */

import { KeyPairType } from '../libsignal.d';
import { ProvisionEnvelopeClass, ProvisionMessageClass } from '../textsecure.d';

type ProvisionDecryptResult = {
  identityKeyPair: KeyPairType;
  number?: string;
  uuid?: string;
  provisioningCode?: string;
  userAgent?: string;
  readReceipts?: boolean;
  profileKey?: ArrayBuffer;
};

class ProvisioningCipherInner {
  keyPair?: KeyPairType;

  async decrypt(
    provisionEnvelope: ProvisionEnvelopeClass
  ): Promise<ProvisionDecryptResult> {
    const masterEphemeral = provisionEnvelope.publicKey.toArrayBuffer();
    const message = provisionEnvelope.body.toArrayBuffer();
    if (new Uint8Array(message)[0] !== 1) {
      throw new Error('Bad version number on ProvisioningMessage');
    }

    const iv = message.slice(1, 16 + 1);
    const mac = message.slice(message.byteLength - 32, message.byteLength);
    const ivAndCiphertext = message.slice(0, message.byteLength - 32);
    const ciphertext = message.slice(16 + 1, message.byteLength - 32);

    if (!this.keyPair) {
      throw new Error('ProvisioningCipher.decrypt: No keypair!');
    }

    return window.libsignal.Curve.async
      .calculateAgreement(masterEphemeral, this.keyPair.privKey)
      .then(async ecRes =>
        window.libsignal.HKDF.deriveSecrets(
          ecRes,
          new ArrayBuffer(32),
          'TextSecure Provisioning Message'
        )
      )
      .then(async keys =>
        window.libsignal.crypto
          .verifyMAC(ivAndCiphertext, keys[1], mac, 32)
          .then(async () =>
            window.libsignal.crypto.decrypt(keys[0], ciphertext, iv)
          )
      )
      .then(async plaintext => {
        const provisionMessage = window.textsecure.protobuf.ProvisionMessage.decode(
          plaintext
        );
        const privKey = provisionMessage.identityKeyPrivate.toArrayBuffer();

        return window.libsignal.Curve.async
          .createKeyPair(privKey)
          .then(keyPair => {
            const ret: ProvisionDecryptResult = {
              identityKeyPair: keyPair,
              number: provisionMessage.number,
              provisioningCode: provisionMessage.provisioningCode,
              userAgent: provisionMessage.userAgent,
              readReceipts: provisionMessage.readReceipts,
              uuid: provisionMessage.uuid,
            };
            if (provisionMessage.profileKey) {
              ret.profileKey = provisionMessage.profileKey.toArrayBuffer();
            }
            return ret;
          });
      });
  }

  async getPublicKey(): Promise<ArrayBuffer> {
    return Promise.resolve()
      .then(async () => {
        if (!this.keyPair) {
          return window.libsignal.Curve.async
            .generateKeyPair()
            .then(keyPair => {
              this.keyPair = keyPair;
            });
        }

        return null;
      })
      .then(() => {
        if (!this.keyPair) {
          throw new Error('ProvisioningCipher.decrypt: No keypair!');
        }

        return this.keyPair.pubKey;
      });
  }

  public async getPrivateKey(): Promise<ArrayBuffer> {
    if (!this.keyPair) {
      return window.libsignal.Curve.async.generateKeyPair().then(keyPair => {
        this.keyPair = keyPair;
        return this.keyPair.privKey;
      });
    }
    return Promise.resolve(this.keyPair.privKey);
  }

  public async encrypt(
    provisionMessage: ProvisionMessageClass,
    publicKey: ArrayBuffer
  ): Promise<ProvisionEnvelopeClass> {
    return this.getPrivateKey().then(async privKey => {
      const plainText = provisionMessage.toArrayBuffer();
      const masterEphemeral = publicKey;

      return window.libsignal.Curve.async
        .calculateAgreement(masterEphemeral, privKey)
        .then(async sharedSecret => {
          return window.libsignal.HKDF.deriveSecrets(
            sharedSecret,
            new ArrayBuffer(32),
            'TextSecure Provisioning Message'
          ).then(async derivedSecret => {
            const version = Uint8Array.from([1]);
            const iv = window.libsignal.crypto.getRandomBytes(16);
            return window.libsignal.crypto
              .encrypt(derivedSecret[0], plainText, iv)
              .then(async (cyphterText: ArrayBuffer) => {
                const versionCyphterText = ProvisioningCipherInner.appendBuffer(
                  ProvisioningCipherInner.appendBuffer(
                    version,
                    new Uint8Array(iv)
                  ),
                  new Uint8Array(cyphterText)
                ).buffer;
                return window.libsignal.crypto
                  .calculateMAC(derivedSecret[1], versionCyphterText)
                  .then(async mac => {
                    const body = ProvisioningCipherInner.appendBuffer(
                      new Uint8Array(versionCyphterText),
                      new Uint8Array(mac)
                    );

                    return this.getPublicKey().then(ownPubKey => {
                      const provisionEnvelope: ProvisionEnvelopeClass = new window.textsecure.protobuf.ProvisionEnvelope();
                      provisionEnvelope.publicKey = new Uint8Array(ownPubKey);
                      provisionEnvelope.body = new Uint8Array(body);
                      return provisionEnvelope;
                    });
                  });
              });
          });
        });
    });
  }

  private static appendBuffer(
    buffer1: Uint8Array,
    buffer2: Uint8Array
  ): Uint8Array {
    const concatArray = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
    concatArray.set(buffer1.slice(), 0);
    concatArray.set(buffer2.slice(), buffer1.byteLength);
    return concatArray;
  }
}

export default class ProvisioningCipher {
  constructor() {
    const inner = new ProvisioningCipherInner();

    this.decrypt = inner.decrypt.bind(inner);
    this.getPublicKey = inner.getPublicKey.bind(inner);
    this.encrypt = inner.encrypt.bind(inner);
  }

  decrypt: (
    provisionEnvelope: ProvisionEnvelopeClass
  ) => Promise<ProvisionDecryptResult>;

  getPublicKey: () => Promise<ArrayBuffer>;

  encrypt: (
    provisionMessage: ProvisionMessageClass,
    publicKey: ArrayBuffer
  ) => Promise<ProvisionEnvelopeClass>;
}
