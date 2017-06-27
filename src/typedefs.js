//
// JSDoc virtually defined types. They don't really exist in code, but we define them in JSDoc for clarity.
//

/**
 * Virtual type representing asymmetric key pair.
 * @name KeyPair
 * @typedef {Object} KeyPair
 * @property {Uint8Array} publicKey - 32 bytes
 * @property {Uint8Array} secretKey - 32 bytes or 64 bytes in case of signing key pair
 * @public
 */

/**
 * Virtual type representing address as server sends it.
 * @name Address
 * @typedef {Object} Address
 * @property {string} address
 * @property {boolean} confirmed
 * @property {boolean} primary
 * @property {string} type - currently always == 'email'
 * @public
 */

/**
 * Virtual type representing invited contact.
 * Username appears when invited contact joins Peerio.
 * @name InvitedContact
 * @typedef {Object} InvitedContact
 * @property {string} email
 * @property {number} added
 * @property {string} [username]
 * @public
 */
