/* eslint-disable no-underscore-dangle */
/* eslint-disable max-classes-per-file */
'use strict';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { Ok, Err, Result } from 'ts-results';
import { Config } from '../common';

// Const ENCRYPTION_KEY = '&P9B+HrMRTb^AwHk%mMCynxbm=Bc=c2G';
const IV_LENGTH = 16;
/**
 * Call with Encryption.encrypt(string)
 */
export default class EncryptionUtil {
	private _stringToEncrypt: string;
	private _stringToDecrypt: string;
	private _bcryptCompareString: string;
	private constructor(encryptString: string, hash?: string) {
		this._stringToEncrypt = encryptString;
		this._stringToDecrypt = encryptString;
		this._bcryptCompareString = hash || '';
	}
	public static encrypt(stringToEncrypt: string): string {
		return new EncryptionUtil(stringToEncrypt)._encryptString().unwrap();
	}
	public static decrypt(decryptionString: string): any {
		return new EncryptionUtil(decryptionString)._decryptString().unwrap();
	}
	public static bcrypt(stringToBCrypt: string): any {
		return new EncryptionUtil(stringToBCrypt)._bcryptString().unwrap();
	}
	public static compare(stringToCompare: string, hash: string): any {
		return new EncryptionUtil(stringToCompare, hash)._bcryptCompare().unwrap();
	}
	// Crypto encrypt
	private _encryptString(): Result<string, 'Encryption Failed: no string to encrypt provided'> {
		if (this._stringToEncrypt) {
			const iv = crypto.randomBytes(IV_LENGTH);
			const cipher = crypto.createCipheriv(
				'aes-256-cbc',
				Buffer.from(String(Config.ENCRYPTION_KEY)),
				iv,
			);
			let encrypted = cipher.update(this._stringToEncrypt);
			encrypted = Buffer.concat([encrypted, cipher.final()]);
			return Ok(iv.toString('hex') + ':' + encrypted.toString('hex'));
		} else {
			throw Err('Encryption Failed: no string to encrypt provided');
		}
	}
	// Crypto decrypt
	private _decryptString(): Result<string, 'Decryption Failed: no decryption string provided'> {
		if (this._stringToDecrypt) {
			const textParts = this._stringToDecrypt.split(':');
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			const iv = Buffer.from(textParts.shift(), 'hex');
			const encryptedText = Buffer.from(textParts.join(':'), 'hex');
			const decipher = crypto.createDecipheriv(
				'aes-256-cbc',
				Buffer.from(String(Config.ENCRYPTION_KEY)),
				iv,
			);
			let decrypted = decipher.update(encryptedText);
			decrypted = Buffer.concat([decrypted, decipher.final()]);
			return Ok(decrypted.toString());
		} else {
			throw Err('Decryption Failed: no decryption string provided');
		}
	}
	// BCrypt encrypt
	private _bcryptString(): Result<string, 'BEncryption Failed: no password string provided'> {
		if (this._stringToEncrypt) {
			const encrypt = bcrypt.hashSync(this._stringToEncrypt, 10);
			return Ok(encrypt);
		} else {
			throw Err('BEncryption Failed: no password string provided');
		}
	}
	// BCryot compare
	private _bcryptCompare(): Result<boolean, 'BEncryption Failed: no password string provided'> {
		if (this._bcryptCompareString) {
			const encrypt = bcrypt.compareSync(this._stringToEncrypt, this._bcryptCompareString);
			return Ok(encrypt);
		} else {
			throw Err('BEncryption Failed: no password string provided');
		}
	}
}
