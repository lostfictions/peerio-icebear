# crypto/keys

Peerio Crypto module for key handling.

## deriveKeys

Deterministically derives boot key and auth key pair.

**Parameters**

-   `username` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 
-   `passphrase` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 
-   `salt` **[Uint8Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)** 

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;[MainKeySetType](#mainkeysettype)>** 

## generateSigningKeyPair

Generates new random signing (ed25519) key pair.
32 byte public key and 64 byte secret key.

Returns **[KeyPairType](#keypairtype)** 

## generateEncryptionKeyPair

Generates new random asymmetric (curve25519) key pair.

Returns **[KeyPairType](#keypairtype)** 

## generateEncryptionKey

Generates new random symmetric (xsalsa20) 32 byte secret key.

Returns **[Uint8Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)** 

# KeyPairType

Standard key pair in binary format.

**Properties**

-   `publicKey` **[Uint8Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)** 
-   `secretKey` **[Uint8Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)** 

# MainKeySetType

Main and minimal Peerio user's key set.
This is required to authenticate and start working, get other keys, etc.

**Properties**

-   `bootKey` **[Uint8Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)** 
-   `authKeyPair` **[KeyPairType](#keypairtype)** 

# crypto/public

Public key encryption module

# crypto/secret

Secret key encryption module

## encrypt

Encrypts and authenticates data using symmetric encryption.
This is a refactored version of nacl.secretbox.
It automatically generates nonce and appends it to the resulting cipher bytes.
This has many performance benefits including more compact, efficient storage and transfer,
and less memory copy operations.

**Parameters**

-   `msg1` **([Uint8Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array) \| [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String))** 
-   `key` **[Uint8Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)** 

Returns **[Uint8Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)** 

# crypto/util

Peerio Crypto Utilities module.

## concatTypedArrays

Concatenates two Uint8Arrays.
Returns new concatenated array.

**Parameters**

-   `buffer1` **[Uint8Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)** 
-   `buffer2` **[Uint8Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)** 

Returns **[Uint8Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)** 

## strToBytes

Converts UTF8 string to byte array.
Uses native TextEncoder with Buffer polyfill fallback.

**Parameters**

-   `str` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 

Returns **[Uint8Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)** 

## bytesToStr

Converts byte array to UTF8 string .
Uses native TextEncoder with Buffer polyfill fallback.

**Parameters**

-   `bytes` **[Uint8Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)** 

Returns **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 

## b64ToBytes

Converts Base64 string to byte array.

**Parameters**

-   `str` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 

Returns **[Uint8Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)** 

## bytesToB64

Converts byte array to Base64 string.

**Parameters**

-   `bytes` **[Uint8Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)** 

Returns **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 

## getRandomNonce

Generates 24-byte unique(almost) random nonce.

Returns **[Uint8Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)** 

# errors

Peerio custom error types and error handling helpers

**Parameters**

-   `unknownErrorObject` **Any** 
-   `failoverMessage` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 

Returns **[Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)** 

# normalize

Use this helper to resolve returning error value.

If you:

-   have a error result from catch() or reject()
-   don't know what exactly that result is, Error, string, undefined or something else
-   don't need custom errors just want to generate meaningful Error object
    then call normalize and pass the result you've got together with fallback message
    that will be wrapped in Error object and returned in case the result wasn't instance of Error

**Parameters**

-   `unknownErrorObject` **Any** 
-   `failoverMessage` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 

Returns **[Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)** 

# bufferExtensions

Icebear client lib entry point

# Buffer

'buffer' module extensions.
This is a side-effect module it modifies and exports the export of buffer module.
