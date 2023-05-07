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
export class EncryptionUtils {
	private _stringToEncrypt: string;
	private _stringToDecrypt: string;
	private _bcryptCompareString: string;
	private constructor(encryptString: string, hash?: string) {
		this._stringToEncrypt = encryptString;
		this._stringToDecrypt = encryptString;
		this._bcryptCompareString = hash || '';
	}
	public static encrypt(stringToEncrypt: string): string {
		return new EncryptionUtils(stringToEncrypt)._encryptString().unwrap();
	}
	public static decrypt(decryptionString: string): any {
		return new EncryptionUtils(decryptionString)._decryptString().unwrap();
	}
	public static bcrypt(stringToBCrypt: string): any {
		return new EncryptionUtils(stringToBCrypt)._bcryptString().unwrap();
	}
	public static compare(stringToCompare: string, hash: string): any {
		return new EncryptionUtils(stringToCompare, hash)._bcryptCompare().unwrap();
	}
	// https://gist.github.com/AndiDittrich/4629e7db04819244e843
	// smaller aes-256-gcm: https://gist.github.com/randomAn0nym0us/ab0f152668bf9c9b8e1e8aebadd0d8f2
	/**
	 * Crypto encrypt
	 * Encrypts text by given key
	 * @param String text to encrypt
	 * @param Buffer masterkey
	 * @returns String encrypted text, base64 encoded
	 */
	private _encryptString(): Result<string, 'Encryption Failed: no string to encrypt provided'> {
		if (this._stringToEncrypt) {
			const iv = crypto.randomBytes(IV_LENGTH);
			// random salt
			const salt = crypto.randomBytes(64);

			/**
			 * derive encryption key: 32 byte key length
			 * in assumption the masterkey is a cryptographic and NOT a password there is no need for
			 * a large number of iterations. It may can replaced by HKDF
			 * the value of 2145 is randomly chosen!
			 */
			const key = crypto.pbkdf2Sync(
				Buffer.from(String(Config.ENCRYPTION_KEY)),
				salt,
				2145,
				32,
				'sha512',
			);

			// AES 256 GCM Mode
			const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

			// encrypt the given text
			const encrypted = Buffer.concat([
				cipher.update(this._stringToEncrypt, 'utf8'),
				cipher.final(),
			]);

			// extract the auth tag
			const tag = cipher.getAuthTag();

			// generate output
			return Ok(Buffer.concat([salt, iv, tag, encrypted]).toString('base64'));
		} else {
			throw Err('Encryption Failed: no string to encrypt provided');
		}
	}
	/**
	 * Crypto decrypt
	 * Decrypts text by given key
	 * @param String base64 encoded input data
	 * @param Buffer masterkey
	 * @returns String decrypted (original) text
	 */
	private _decryptString(): Result<string, 'Decryption Failed: no decryption string provided'> {
		if (this._stringToDecrypt) {
			// base64 decoding
			const bData = Buffer.from(this._stringToDecrypt, 'base64');
			// convert data to buffers
			const salt = bData.subarray(0, 64);
			const iv = bData.subarray(64, 80);
			const tag = bData.subarray(80, 96);
			const text = bData.subarray(96);

			// derive key using; 32 byte key length
			const key = crypto.pbkdf2Sync(
				Buffer.from(String(Config.ENCRYPTION_KEY)),
				salt,
				2145,
				32,
				'sha512',
			);

			// AES 256 GCM Mode
			const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
			decipher.setAuthTag(tag);

			// decrypt the given text
			// @ts-ignore
			const decrypted = decipher.update(text, 'binary', 'utf8') + decipher.final('utf8');

			return Ok(decrypted);
		} else {
			throw Err('Decryption Failed: no decryption string provided');
		}
	}
	// BCrypt encrypt
	private _bcryptString(): Result<string, 'BEncryption Failed: no string provided'> {
		if (this._stringToEncrypt) {
			const encrypt = bcrypt.hashSync(this._stringToEncrypt, 10);
			return Ok(encrypt);
		} else {
			throw Err('BEncryption Failed: no password string provided');
		}
	}
	// BCryot compare
	private _bcryptCompare(): Result<boolean, 'BEncryption Failed: no string provided'> {
		if (this._bcryptCompareString) {
			const encrypt = bcrypt.compareSync(this._stringToEncrypt, this._bcryptCompareString);
			return Ok(encrypt);
		} else {
			throw Err('BEncryption Failed: no password string provided');
		}
	}
}
