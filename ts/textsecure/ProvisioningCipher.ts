// Copyright 2020-2021 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

/* eslint-disable more/no-then */
/* eslint-disable max-classes-per-file */

import { KeyPairType } from './Types.d';
import { ProvisionEnvelopeClass, ProvisionMessageClass } from '../textsecure.d';
import {
  decryptAes256CbcPkcsPadding,
  deriveSecrets,
  encryptAes256CbcPkcsPadding,
  bytesFromString,
  hmacSha256,
  verifyHmacSha256,
  getRandomBytes,
} from '../Crypto';
import { calculateAgreement, createKeyPair, generateKeyPair } from '../Curve';

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

    const ecRes = calculateAgreement(masterEphemeral, this.keyPair.privKey);
    const keys = deriveSecrets(
      ecRes,
      new ArrayBuffer(32),
      bytesFromString('TextSecure Provisioning Message')
    );
    await verifyHmacSha256(ivAndCiphertext, keys[1], mac, 32);

    const plaintext = await decryptAes256CbcPkcsPadding(
      keys[0],
      ciphertext,
      iv
    );
    const provisionMessage = window.textsecure.protobuf.ProvisionMessage.decode(
      plaintext
    );
    const privKey = provisionMessage.identityKeyPrivate.toArrayBuffer();

    const keyPair = createKeyPair(privKey);
    window.normalizeUuids(
      provisionMessage,
      ['uuid'],
      'ProvisioningCipher.decrypt'
    );

    const ret: ProvisionDecryptResult = {
      identityKeyPair: keyPair,
      number: provisionMessage.number,
      uuid: provisionMessage.uuid,
      provisioningCode: provisionMessage.provisioningCode,
      userAgent: provisionMessage.userAgent,
      readReceipts: provisionMessage.readReceipts,
    };
    if (provisionMessage.profileKey) {
      ret.profileKey = provisionMessage.profileKey.toArrayBuffer();
    }
    return ret;
  }

  async getPublicKey(): Promise<ArrayBuffer> {
    if (!this.keyPair) {
      this.keyPair = generateKeyPair();
    }

    if (!this.keyPair) {
      throw new Error('ProvisioningCipher.decrypt: No keypair!');
    }

    return this.keyPair.pubKey;
  }

  public async getPrivateKey(): Promise<ArrayBuffer> {
    if (!this.keyPair) {
      this.keyPair = generateKeyPair();
      return this.keyPair.privKey;
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

      const sharedSecret = calculateAgreement(masterEphemeral, privKey);
      const derivedSecret = deriveSecrets(
        sharedSecret,
        new ArrayBuffer(32),
        bytesFromString('TextSecure Provisioning Message')
      );
      const version = Uint8Array.from([1]);
      const iv = getRandomBytes(16);
      const cyphterText = await encryptAes256CbcPkcsPadding(
        derivedSecret[0],
        plainText,
        iv
      );
      const versionCyphterText = ProvisioningCipherInner.appendBuffer(
        ProvisioningCipherInner.appendBuffer(version, new Uint8Array(iv)),
        new Uint8Array(cyphterText)
      ).buffer;
      const mac = await hmacSha256(derivedSecret[1], versionCyphterText);
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
