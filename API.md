# crypto/keys

Peerio Crypto module for key handling.

## deriveKeys

Deterministically derives boot key and auth key pair.

**Parameters**

-   `username` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 
-   `passphrase` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 
-   `salt` **[Uint8Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)** 

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;MainKeySetType>** 

## generateSigningKeys

Generates new random signing (ed25519) key pair.

Returns **KeyPairType** 

# crypto/util

Peerio Crypto Utilities module.

## concatBuffers

Concatenates two Uint8Arrays.
Returns new concatenated array.

**Parameters**

-   `buffer1` **[Uint8Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)** 
-   `buffer2` **[Uint8Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)** 

Returns **[Uint8Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)** 
