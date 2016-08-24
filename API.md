# crypto/keys

Peerio Crypto module for key handling.

## deriveKeys

Deterministically derives boot key and auth key pair.

**Parameters**

-   `username` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 
-   `passphrase` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 
-   `salt` **[Uint8Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)** 

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;[MainKeySetType](#mainkeysettype)>** 

## generateSigningKeys

Generates new random signing (ed25519) key pair.

Returns **[KeyPairType](#keypairtype)** 

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

# crypto/util

Peerio Crypto Utilities module.

## concatBuffers

Concatenates two Uint8Arrays.
Returns new concatenated array.

**Parameters**

-   `buffer1` **[Uint8Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)** 
-   `buffer2` **[Uint8Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)** 

Returns **[Uint8Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)** 

## strToBytes

Converts UTF8 string to byte array

**Parameters**

-   `str` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 

Returns **[Uint8Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)** 

## bytesToStr

Converts byte array to UTF8 string

**Parameters**

-   `bytes` **[Uint8Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)** 

Returns **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 

## b64ToBytes

Converts Base64 string to byte array

**Parameters**

-   `str` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 

Returns **[Uint8Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)** 

## bytesToB64

Converts byte array to Base64 string

**Parameters**

-   `bytes` **[Uint8Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)** 

Returns **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 
