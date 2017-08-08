# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="2.0.0"></a>
# [2.0.0](https://github.com/PeerioTechnologies/peerio-icebear/compare/v1.5.2...v2.0.0) (2017-08-08)


### Bug Fixes

* some safety nets for files and fix for anti-tamper protection ([ce20e4a](https://github.com/PeerioTechnologies/peerio-icebear/commit/ce20e4a))
* **keg:** safe deserilizaton, avoid rewriting values with empty ones from empty keg ([a1d4423](https://github.com/PeerioTechnologies/peerio-icebear/commit/a1d4423))
* **logs:** remove usernames from logs ([#27](https://github.com/PeerioTechnologies/peerio-icebear/issues/27)) ([c0a458f](https://github.com/PeerioTechnologies/peerio-icebear/commit/c0a458f))


### Features

* **channel:** create channel with chat-store ([c2ed205](https://github.com/PeerioTechnologies/peerio-icebear/commit/c2ed205))
* **chat:** chat gets new observable property `added` ([a6dfa5b](https://github.com/PeerioTechnologies/peerio-icebear/commit/a6dfa5b))
* **chat:** chat store supports adding chat instance, thus reusing chat instance when creating new chat instead of reloading it ([4541f88](https://github.com/PeerioTechnologies/peerio-icebear/commit/4541f88))
* **chat:** support for chat and channel 'purpose' property ([2378e7a](https://github.com/PeerioTechnologies/peerio-icebear/commit/2378e7a))
* **keg:** keg.dirty observable added to react to successful keg save ([3a871aa](https://github.com/PeerioTechnologies/peerio-icebear/commit/3a871aa))
* **keg:** keyId property removed from keg ([f89873f](https://github.com/PeerioTechnologies/peerio-icebear/commit/f89873f))
* **kegs:** kegs support 'format' metadata property to track changes in keg payload and props structure ([8e5016e](https://github.com/PeerioTechnologies/peerio-icebear/commit/8e5016e))
* chat store loads and sorts channels ([0faa2c1](https://github.com/PeerioTechnologies/peerio-icebear/commit/0faa2c1))
* Merge branch 'feat-channels' into dev ([532f2b0](https://github.com/PeerioTechnologies/peerio-icebear/commit/532f2b0))
* update tracker doesn't try to minimise traffic and amount of data to process on reconnect anymore ([0e44d16](https://github.com/PeerioTechnologies/peerio-icebear/commit/0e44d16))
* **quotas:** channel limit ([3522961](https://github.com/PeerioTechnologies/peerio-icebear/commit/3522961))


### BREAKING CHANGES

* - Some chats are now channels, your client must support channels or it will confuse them for DMs
- update-tracker.js: removed `activateKegDb()` `deactivateKegDb()`
- keg.js: now assumes there's always a list of keys in keg db and uses keyId for crypto
- chat-keg-db.js: redone to support channels, clarity improvements TBD
- chat-boot-keg.js: redone to support channels and prepared for DM boot keg format migration
- system-messages.js: added new system message type - purposeChange
* **keg:** Keg#keyId is removed. No reason to have it in the keg instance, it's only used during deserialization.



<a name="1.5.2"></a>
## [1.5.2](https://github.com/PeerioTechnologies/peerio-icebear/compare/v1.5.1...v1.5.2) (2017-08-01)


### Bug Fixes

* regression ([e82c75b](https://github.com/PeerioTechnologies/peerio-icebear/commit/e82c75b))



<a name="1.5.1"></a>
## [1.5.1](https://github.com/PeerioTechnologies/peerio-icebear/compare/v1.5.0...v1.5.1) (2017-08-01)


### Bug Fixes

* make sure mobx `when` effect is called asynchronously for sequence-critical logic ([282d121](https://github.com/PeerioTechnologies/peerio-icebear/commit/282d121))



<a name="1.5.0"></a>
# [1.5.0](https://github.com/PeerioTechnologies/peerio-icebear/compare/v1.4.0...v1.5.0) (2017-07-11)


### Features

* **plans:** get the list of active paid plans ([#26](https://github.com/PeerioTechnologies/peerio-icebear/issues/26)) ([2ce915e](https://github.com/PeerioTechnologies/peerio-icebear/commit/2ce915e))



<a name="1.4.0"></a>
# [1.4.0](https://github.com/PeerioTechnologies/peerio-icebear/compare/v1.3.0...v1.4.0) (2017-07-02)


### Features

* **signup:** signup sends client version information according to the new api signature ([755088d](https://github.com/PeerioTechnologies/peerio-icebear/commit/755088d))


### Performance Improvements

* **files:** file map added to file store to use instead of linear search ([2d4f9f0](https://github.com/PeerioTechnologies/peerio-icebear/commit/2d4f9f0))



<a name="1.3.0"></a>
# [1.3.0](https://github.com/PeerioTechnologies/peerio-icebear/compare/v1.2.1...v1.3.0) (2017-07-01)


### Features

* **contact:** added Contact#isLegacy property to see if user was not found because migration is pending ([7351154](https://github.com/PeerioTechnologies/peerio-icebear/commit/7351154))
* **files:** enabled file re-sharing ([68f17b6](https://github.com/PeerioTechnologies/peerio-icebear/commit/68f17b6))



<a name="1.2.1"></a>
## [1.2.1](https://github.com/PeerioTechnologies/peerio-icebear/compare/v1.2.0...v1.2.1) (2017-07-01)


### Bug Fixes

* converted __sdk.json to __sdk.js to avoid copying in on clients when compiling icebear ([d69c2c4](https://github.com/PeerioTechnologies/peerio-icebear/commit/d69c2c4))



<a name="1.2.0"></a>
# [1.2.0](https://github.com/PeerioTechnologies/peerio-icebear/compare/v1.1.5...v1.2.0) (2017-07-01)


### Bug Fixes

* build script fixed to make docs show correct version + update __sdk.json file ([bddbf3a](https://github.com/PeerioTechnologies/peerio-icebear/commit/bddbf3a))
* hooks do `npm install` now too ([b1509a7](https://github.com/PeerioTechnologies/peerio-icebear/commit/b1509a7))


### Features

* **auth:** client sends sdk version on auth attempt ([7191c21](https://github.com/PeerioTechnologies/peerio-icebear/commit/7191c21))
* **auth:** support for server auth deny due to client deprecation ([73888c7](https://github.com/PeerioTechnologies/peerio-icebear/commit/73888c7))



<a name="1.1.5"></a>
## [1.1.5](https://github.com/PeerioTechnologies/peerio-icebear/compare/v1.1.4...v1.1.5) (2017-06-29)



<a name="1.1.4"></a>
## [1.1.4](https://github.com/PeerioTechnologies/peerio-icebear/compare/v1.1.3...v1.1.4) (2017-06-29)



<a name="1.1.3"></a>
## [1.1.3](https://github.com/PeerioTechnologies/peerio-icebear/compare/v1.1.2...v1.1.3) (2017-06-29)



<a name="1.1.2"></a>
## [1.1.2](https://github.com/PeerioTechnologies/peerio-icebear/compare/v1.1.1...v1.1.2) (2017-06-28)



<a name="1.1.1"></a>
## [1.1.1](https://github.com/PeerioTechnologies/peerio-icebear/compare/v1.1.0...v1.1.1) (2017-06-28)



<a name="1.1.0"></a>
# 1.1.0 (2017-06-28)


### Bug Fixes

* **auth:** not failing if saved username does not exist ([fc30093](https://github.com/PeerioTechnologies/peerio-icebear/commit/fc30093))
* **auth:** send arch to server ([b63d1ef](https://github.com/PeerioTechnologies/peerio-icebear/commit/b63d1ef))
* **auth:** version, platform ([182a1cc](https://github.com/PeerioTechnologies/peerio-icebear/commit/182a1cc))
* **avatar:** update avatar letter on first name change ([82cec6d](https://github.com/PeerioTechnologies/peerio-icebear/commit/82cec6d))
* **avatars:** api change ([200d3f5](https://github.com/PeerioTechnologies/peerio-icebear/commit/200d3f5))
* **bluebird:** disable promise warnings for empty returns ([7ba3832](https://github.com/PeerioTechnologies/peerio-icebear/commit/7ba3832))
* **build:** moment should be in dependencies and peerDependencies ([ece5a1d](https://github.com/PeerioTechnologies/peerio-icebear/commit/ece5a1d))
* **chat:** any activity in hidden chat automatically unhides it ([6ebfcd0](https://github.com/PeerioTechnologies/peerio-icebear/commit/6ebfcd0))
* **chat:** better grouping for sending messages ([28439a6](https://github.com/PeerioTechnologies/peerio-icebear/commit/28439a6))
* **chat:** chat create/load logic ([cbaa1c3](https://github.com/PeerioTechnologies/peerio-icebear/commit/cbaa1c3))
* **chat:** chat hide logic improvement ([f7f971a](https://github.com/PeerioTechnologies/peerio-icebear/commit/f7f971a))
* **chat:** don't show new messages marker for own messages ([13da762](https://github.com/PeerioTechnologies/peerio-icebear/commit/13da762))
* **chat:** fail-safe chat keg db ([f14f9a9](https://github.com/PeerioTechnologies/peerio-icebear/commit/f14f9a9))
* **chat:** failsafe chat hiding ([a931800](https://github.com/PeerioTechnologies/peerio-icebear/commit/a931800))
* **chat:** fix chat favorite state sync ([6e90d82](https://github.com/PeerioTechnologies/peerio-icebear/commit/6e90d82))
* **chat:** fix receipts and unread count logic ([7a24828](https://github.com/PeerioTechnologies/peerio-icebear/commit/7a24828))
* **chat:** fix receipts freeze under certain circumstances ([cb0a8cd](https://github.com/PeerioTechnologies/peerio-icebear/commit/cb0a8cd))
* **chat:** frozen receipts ([44a04eb](https://github.com/PeerioTechnologies/peerio-icebear/commit/44a04eb))
* **chat:** handle empty message kegs properly ([4d3ad7a](https://github.com/PeerioTechnologies/peerio-icebear/commit/4d3ad7a))
* **chat:** last bits of error resiliency ([e91b61a](https://github.com/PeerioTechnologies/peerio-icebear/commit/e91b61a))
* **chat:** mark as seen ([0bdb578](https://github.com/PeerioTechnologies/peerio-icebear/commit/0bdb578))
* **chat:** mark messages as read in 2 seconds instead of 3 ([c4b2624](https://github.com/PeerioTechnologies/peerio-icebear/commit/c4b2624))
* **chat:** no fail on emty kegs ([692b863](https://github.com/PeerioTechnologies/peerio-icebear/commit/692b863))
* **chat:** prevent overwriting most recent message when paging up ([9adff23](https://github.com/PeerioTechnologies/peerio-icebear/commit/9adff23))
* **chat:** remove leading/trailing whitespace from chat names ([bdcb161](https://github.com/PeerioTechnologies/peerio-icebear/commit/bdcb161))
* **chat:** somewhat fix message receive event ([62d2384](https://github.com/PeerioTechnologies/peerio-icebear/commit/62d2384))
* **chat:** validate chat name ([57e6cb8](https://github.com/PeerioTechnologies/peerio-icebear/commit/57e6cb8))
* **chat:** way better and smarter way to handle marking chat message as 'read' and removing new messages marker ([8a24edd](https://github.com/PeerioTechnologies/peerio-icebear/commit/8a24edd))
* **chatlist:** fix hidden chat not reappearing under specific circumstances ([57da5f5](https://github.com/PeerioTechnologies/peerio-icebear/commit/57da5f5))
* **chatlist:** sort favorite chats by name ([1e7f2a5](https://github.com/PeerioTechnologies/peerio-icebear/commit/1e7f2a5))
* **chats:** chat rename ([0449788](https://github.com/PeerioTechnologies/peerio-icebear/commit/0449788))
* **chats:** chats not loading for new accounts ([9a56208](https://github.com/PeerioTechnologies/peerio-icebear/commit/9a56208))
* **chats:** fix duplicate messages ([8d57eb3](https://github.com/PeerioTechnologies/peerio-icebear/commit/8d57eb3))
* **chats:** fix new message counter issues and updating after reconnect issues ([5a988ee](https://github.com/PeerioTechnologies/peerio-icebear/commit/5a988ee))
* **chats:** fix receipt loading after diconnect ([8b096e5](https://github.com/PeerioTechnologies/peerio-icebear/commit/8b096e5))
* **chats:** fixes chat refactor issues ([a04cf8b](https://github.com/PeerioTechnologies/peerio-icebear/commit/a04cf8b))
* **chats:** new chat gets activated ([ca41eac](https://github.com/PeerioTechnologies/peerio-icebear/commit/ca41eac))
* **chats:** new chats loading correctly after reconnect ([e310c56](https://github.com/PeerioTechnologies/peerio-icebear/commit/e310c56))
* **chats:** open cached chat from new chat screen ([a2e8cbc](https://github.com/PeerioTechnologies/peerio-icebear/commit/a2e8cbc))
* **chats:** refactor typo ([e270bb5](https://github.com/PeerioTechnologies/peerio-icebear/commit/e270bb5))
* **chats:** removing name from a new chat created unused 'chat name cleared' event ([3002cd6](https://github.com/PeerioTechnologies/peerio-icebear/commit/3002cd6))
* **chats:** reworked chat load/add/hide/star/unstar logic ([2ab2b5b](https://github.com/PeerioTechnologies/peerio-icebear/commit/2ab2b5b))
* **chats:** sendMessage as a mobx action ([44cb169](https://github.com/PeerioTechnologies/peerio-icebear/commit/44cb169))
* **config:** coverage reporter fix ([784b79d](https://github.com/PeerioTechnologies/peerio-icebear/commit/784b79d))
* **config:** fixed url config ([07d286d](https://github.com/PeerioTechnologies/peerio-icebear/commit/07d286d))
* **config:** restore proper socket URL ([e1930a1](https://github.com/PeerioTechnologies/peerio-icebear/commit/e1930a1))
* **contact:** make contact lookup case insensitive ([4a45905](https://github.com/PeerioTechnologies/peerio-icebear/commit/4a45905))
* **contact:** unicode aware first letter extraction ([b467a7f](https://github.com/PeerioTechnologies/peerio-icebear/commit/b467a7f))
* **contacts:** all kinds of invite fixes ([6c070af](https://github.com/PeerioTechnologies/peerio-icebear/commit/6c070af))
* **contacts:** deduplicate invites keg data ([61c005d](https://github.com/PeerioTechnologies/peerio-icebear/commit/61c005d))
* **contacts:** fav contacts not loading at login ([c4966ec](https://github.com/PeerioTechnologies/peerio-icebear/commit/c4966ec))
* **contacts:** flag not found contact properly ([18938c7](https://github.com/PeerioTechnologies/peerio-icebear/commit/18938c7))
* **contacts:** now that we hide chats, make sure we still have all our previous contact in user picker ([1a541ae](https://github.com/PeerioTechnologies/peerio-icebear/commit/1a541ae))
* **contacts:** prevent duplicate contacts when looking up by email ([bb7f353](https://github.com/PeerioTechnologies/peerio-icebear/commit/bb7f353))
* **core:** retry logic returning original promise instead of recreating it ([2131b15](https://github.com/PeerioTechnologies/peerio-icebear/commit/2131b15))
* **core:** snowflake minimal value is null ([241a752](https://github.com/PeerioTechnologies/peerio-icebear/commit/241a752))
* **core:** switch to a new server query api ([e58d7bb](https://github.com/PeerioTechnologies/peerio-icebear/commit/e58d7bb))
* **core:** synced keg initial load and chat rename fix ([86db184](https://github.com/PeerioTechnologies/peerio-icebear/commit/86db184))
* **core:** toLocaleLowerCase where applicable ([b52e7b2](https://github.com/PeerioTechnologies/peerio-icebear/commit/b52e7b2))
* **crypto:** 5x faster fingerprint calculation ([e657e7e](https://github.com/PeerioTechnologies/peerio-icebear/commit/e657e7e))
* **crypto:** expose keys, public, secret crypto (for ghost use) ([4a0577d](https://github.com/PeerioTechnologies/peerio-icebear/commit/4a0577d))
* **crypto:** hex to bytes for ghost ([4dacf03](https://github.com/PeerioTechnologies/peerio-icebear/commit/4dacf03))
* **crypto:** improve getRandomNumber ([5c45215](https://github.com/PeerioTechnologies/peerio-icebear/commit/5c45215))
* **crypto:** increase interruptStep for most key derivations ([e60e763](https://github.com/PeerioTechnologies/peerio-icebear/commit/e60e763))
* **crypto:** keys ([029f43e](https://github.com/PeerioTechnologies/peerio-icebear/commit/029f43e))
* **crypto:** node support for crypto utils prng ([fbf9506](https://github.com/PeerioTechnologies/peerio-icebear/commit/fbf9506))
* **crypto:** passcode generation bug, some refactor ([e0f4403](https://github.com/PeerioTechnologies/peerio-icebear/commit/e0f4403))
* **crypto:** restore deriveKeys function resolving a value ([8596608](https://github.com/PeerioTechnologies/peerio-icebear/commit/8596608))
* **crypto:** throw correct error if nacl.box.open returns false ([f68b388](https://github.com/PeerioTechnologies/peerio-icebear/commit/f68b388))
* **crypto-util:** fix arraybuffer implementation for safari ([3748aa8](https://github.com/PeerioTechnologies/peerio-icebear/commit/3748aa8))
* **cryptoUtil:** export getRandomUserSpecificIdHex ([47d1071](https://github.com/PeerioTechnologies/peerio-icebear/commit/47d1071))
* **db:** export db & document ([331392c](https://github.com/PeerioTechnologies/peerio-icebear/commit/331392c))
* **dependencies:** documentation version not found ([36c8c03](https://github.com/PeerioTechnologies/peerio-icebear/commit/36c8c03))
* **env:** use env variables ❓ ([12ae46d](https://github.com/PeerioTechnologies/peerio-icebear/commit/12ae46d))
* **errors:** typo ([eababa5](https://github.com/PeerioTechnologies/peerio-icebear/commit/eababa5))
* **file:** reject promise on upload error ([581587b](https://github.com/PeerioTechnologies/peerio-icebear/commit/581587b))
* **files:** append mode ([5f0610b](https://github.com/PeerioTechnologies/peerio-icebear/commit/5f0610b))
* **files:** cancel download ([647915e](https://github.com/PeerioTechnologies/peerio-icebear/commit/647915e))
* **files:** cancel upload queue ([ff66852](https://github.com/PeerioTechnologies/peerio-icebear/commit/ff66852))
* **files:** cancel upload queue ([4ae0c26](https://github.com/PeerioTechnologies/peerio-icebear/commit/4ae0c26))
* **files:** canUploadFileSize calculated incorrectly ([cb32649](https://github.com/PeerioTechnologies/peerio-icebear/commit/cb32649))
* **files:** changed files to be shared only in chat, removed file counter ([7c66432](https://github.com/PeerioTechnologies/peerio-icebear/commit/7c66432))
* **files:** close share dialog after files are shared ([addf8a2](https://github.com/PeerioTechnologies/peerio-icebear/commit/addf8a2))
* **files:** correct shared file props deserialization ([b47d055](https://github.com/PeerioTechnologies/peerio-icebear/commit/b47d055))
* **files:** deleted files correctly removing from the list ([e0da6bd](https://github.com/PeerioTechnologies/peerio-icebear/commit/e0da6bd))
* **files:** exists is a promise ([67c3692](https://github.com/PeerioTechnologies/peerio-icebear/commit/67c3692))
* **files:** exists is a promise ([9c52ea5](https://github.com/PeerioTechnologies/peerio-icebear/commit/9c52ea5))
* **files:** file up/download snackbars ([7bdb76b](https://github.com/PeerioTechnologies/peerio-icebear/commit/7bdb76b))
* **files:** fix file counter not clearing under certain circumstances ([520f582](https://github.com/PeerioTechnologies/peerio-icebear/commit/520f582))
* **files:** fix file update logic ([a944f2b](https://github.com/PeerioTechnologies/peerio-icebear/commit/a944f2b))
* **files:** fix uploaded files being stuck in 'processing' state sometimes ([4b98a62](https://github.com/PeerioTechnologies/peerio-icebear/commit/4b98a62))
* **files:** make most recent files always be on top ([725a309](https://github.com/PeerioTechnologies/peerio-icebear/commit/725a309))
* **files:** new sharing api ([b7fd43b](https://github.com/PeerioTechnologies/peerio-icebear/commit/b7fd43b))
* **files:** no systemWarnings when file upload is cancelled ([d6b79e6](https://github.com/PeerioTechnologies/peerio-icebear/commit/d6b79e6))
* **files:** notice when upload “queue” is consumed ([63dbb20](https://github.com/PeerioTechnologies/peerio-icebear/commit/63dbb20))
* **files:** notification for fast uploads ([9911a6d](https://github.com/PeerioTechnologies/peerio-icebear/commit/9911a6d))
* **files:** owner displaying properly ([4fd6df8](https://github.com/PeerioTechnologies/peerio-icebear/commit/4fd6df8))
* **files:** owner username was empty if it was user's own file ([7506b6b](https://github.com/PeerioTechnologies/peerio-icebear/commit/7506b6b))
* **files:** pace file sharing ([533ca03](https://github.com/PeerioTechnologies/peerio-icebear/commit/533ca03))
* **files:** prevent updating file kegs that were loaded initially, also removes extra re-encrypt attempt ([b80f8bb](https://github.com/PeerioTechnologies/peerio-icebear/commit/b80f8bb))
* **files:** progress bar fix ([37536ca](https://github.com/PeerioTechnologies/peerio-icebear/commit/37536ca))
* **files:** proper selection and search logic ([4df190b](https://github.com/PeerioTechnologies/peerio-icebear/commit/4df190b))
* **files:** re-sharing keg deleted by recipient works now ([d96c20d](https://github.com/PeerioTechnologies/peerio-icebear/commit/d96c20d))
* **files:** read queue>1 corrupts files ([8525c6e](https://github.com/PeerioTechnologies/peerio-icebear/commit/8525c6e))
* **files:** restore query changes ([972230f](https://github.com/PeerioTechnologies/peerio-icebear/commit/972230f))
* **files:** safer file list loading ([771a777](https://github.com/PeerioTechnologies/peerio-icebear/commit/771a777))
* **files:** small fixes ([b8025b6](https://github.com/PeerioTechnologies/peerio-icebear/commit/b8025b6))
* **files:** support s3 way of handling out of range requests ([1633b91](https://github.com/PeerioTechnologies/peerio-icebear/commit/1633b91))
* **files:** switch file store to new query api ([f82720d](https://github.com/PeerioTechnologies/peerio-icebear/commit/f82720d))
* **files:** update shareable state after upload ([c164db9](https://github.com/PeerioTechnologies/peerio-icebear/commit/c164db9))
* **files:** upload fix ([45f9a2e](https://github.com/PeerioTechnologies/peerio-icebear/commit/45f9a2e))
* **fs:** generate unique file path ([f3320d9](https://github.com/PeerioTechnologies/peerio-icebear/commit/f3320d9))
* **ghost:** attach signature ([4176b88](https://github.com/PeerioTechnologies/peerio-icebear/commit/4176b88))
* **ghost:** do not assume ghost frontend url will have slash in the end ([7b13c6f](https://github.com/PeerioTechnologies/peerio-icebear/commit/7b13c6f))
* **ghost:** expiry handling ([8bfab33](https://github.com/PeerioTechnologies/peerio-icebear/commit/8bfab33))
* **ghost:** fix fileIDs when attaching files ([aac6c68](https://github.com/PeerioTechnologies/peerio-icebear/commit/aac6c68))
* **ghost:** include signing key in ciphertext ([03ada83](https://github.com/PeerioTechnologies/peerio-icebear/commit/03ada83))
* **ghost:** load ghost properties + revoke ([40d326b](https://github.com/PeerioTechnologies/peerio-icebear/commit/40d326b))
* **ghost:** message preview ([3e95c58](https://github.com/PeerioTechnologies/peerio-icebear/commit/3e95c58))
* **ghost:** passphrase initialization ([3e7aa24](https://github.com/PeerioTechnologies/peerio-icebear/commit/3e7aa24))
* **ghost:** remove afterLoad ([39f6f28](https://github.com/PeerioTechnologies/peerio-icebear/commit/39f6f28))
* **ghost:** replace old clock with new clock ([2a532be](https://github.com/PeerioTechnologies/peerio-icebear/commit/2a532be))
* **ghost:** revoke ([f7ff781](https://github.com/PeerioTechnologies/peerio-icebear/commit/f7ff781))
* **ghost:** use moment ([967cb15](https://github.com/PeerioTechnologies/peerio-icebear/commit/967cb15))
* **ghosts:** frontend url + debug ([5742a5c](https://github.com/PeerioTechnologies/peerio-icebear/commit/5742a5c))
* **ghosts:** if there are no ghosts, selectedId is unset ([0606869](https://github.com/PeerioTechnologies/peerio-icebear/commit/0606869))
* **ghosts:** if there are no ghosts, selectedId is unset ([d9de688](https://github.com/PeerioTechnologies/peerio-icebear/commit/d9de688))
* **ghosts:** load properties from kegs properly ([2f11359](https://github.com/PeerioTechnologies/peerio-icebear/commit/2f11359))
* **interface:** do not export icebear db ([a5edcca](https://github.com/PeerioTechnologies/peerio-icebear/commit/a5edcca))
* **ios:** add Uint8Array.slice polyfill for ios ([2d0e7a5](https://github.com/PeerioTechnologies/peerio-icebear/commit/2d0e7a5))
* **kegs:** chatbootkeg ([842b502](https://github.com/PeerioTechnologies/peerio-icebear/commit/842b502))
* **kegs:** don't fail evrything for the sake of one corrupted keg ([660f30d](https://github.com/PeerioTechnologies/peerio-icebear/commit/660f30d))
* **kegs:** failsafe keg version increment ([0b23ebe](https://github.com/PeerioTechnologies/peerio-icebear/commit/0b23ebe))
* **kegs:** fixed broken plaintext keg save ([80fb547](https://github.com/PeerioTechnologies/peerio-icebear/commit/80fb547))
* **l18n:** forgot one ([e627ce7](https://github.com/PeerioTechnologies/peerio-icebear/commit/e627ce7))
* **login:** enable cehcking for passcode even when authKeys are loaded from cache ([bc26bb3](https://github.com/PeerioTechnologies/peerio-icebear/commit/bc26bb3))
* **login:** fill keys on login ([ea5a4df](https://github.com/PeerioTechnologies/peerio-icebear/commit/ea5a4df))
* **login:** load profile, then store last auth’d ([cef1e7c](https://github.com/PeerioTechnologies/peerio-icebear/commit/cef1e7c))
* **login:** relogin process hangs if server forcibly closes the connection during login ([e6f0128](https://github.com/PeerioTechnologies/peerio-icebear/commit/e6f0128))
* **login:** theoretical support for user firstname on return ([eeb1883](https://github.com/PeerioTechnologies/peerio-icebear/commit/eeb1883))
* **message:** don’t check mentions if empty text ([ed1efc8](https://github.com/PeerioTechnologies/peerio-icebear/commit/ed1efc8))
* **message:** make sure to clear message.files on deserialization ([ff689cb](https://github.com/PeerioTechnologies/peerio-icebear/commit/ff689cb))
* **migrator:** fix migration crypto ([3d8246e](https://github.com/PeerioTechnologies/peerio-icebear/commit/3d8246e))
* **mobile:** fix for android javascriptcore subarray ([15d4237](https://github.com/PeerioTechnologies/peerio-icebear/commit/15d4237))
* **mobile:** unicode literal ([6ca2041](https://github.com/PeerioTechnologies/peerio-icebear/commit/6ca2041))
* **models:** add KegDB.toJSON to avoid cycles ([#25](https://github.com/PeerioTechnologies/peerio-icebear/issues/25)) ([da68adb](https://github.com/PeerioTechnologies/peerio-icebear/commit/da68adb))
* **net:** fix onceAuthenticated event, that wasn't actually firing ([7fccbac](https://github.com/PeerioTechnologies/peerio-icebear/commit/7fccbac))
* **passcode:** clean up test cases ([8ce23da](https://github.com/PeerioTechnologies/peerio-icebear/commit/8ce23da))
* **passcode:** return hasPasscode back ([e8cd149](https://github.com/PeerioTechnologies/peerio-icebear/commit/e8cd149))
* **passphrases:** dictionary collection ([969bf5f](https://github.com/PeerioTechnologies/peerio-icebear/commit/969bf5f))
* **passphrases:** spaces ([800b406](https://github.com/PeerioTechnologies/peerio-icebear/commit/800b406))
* **perf:** disable verifyKegSignature for now ([36351f4](https://github.com/PeerioTechnologies/peerio-icebear/commit/36351f4))
* **profile:** fix primary address confirmation fact not updating ([35bd444](https://github.com/PeerioTechnologies/peerio-icebear/commit/35bd444))
* **profile:** notify user when they try to add confirmed email ([3cf80cc](https://github.com/PeerioTechnologies/peerio-icebear/commit/3cf80cc))
* **profile:** primary address loading correctly ([1586fdd](https://github.com/PeerioTechnologies/peerio-icebear/commit/1586fdd))
* **profile:** remove readonly fields ([c6973d2](https://github.com/PeerioTechnologies/peerio-icebear/commit/c6973d2))
* **profile:** trim user's names on save ([4280bae](https://github.com/PeerioTechnologies/peerio-icebear/commit/4280bae))
* **queries:** file & ghost deleted: ‘false’ -> false ([11c295c](https://github.com/PeerioTechnologies/peerio-icebear/commit/11c295c))
* **quota:** fix quota not updating ([81e3241](https://github.com/PeerioTechnologies/peerio-icebear/commit/81e3241))
* **quota:** quota percent converted to number ([4ffaba3](https://github.com/PeerioTechnologies/peerio-icebear/commit/4ffaba3))
* **receipt:** switch receipts to named kegs, deprecate 'receipt' type, add 'read_receipt' instead ([a662bc7](https://github.com/PeerioTechnologies/peerio-icebear/commit/a662bc7))
* **receipts:** don't load deleted receipts ([8d3dce6](https://github.com/PeerioTechnologies/peerio-icebear/commit/8d3dce6))
* **receipts:** fix receipts after refactor ([e00b935](https://github.com/PeerioTechnologies/peerio-icebear/commit/e00b935))
* **receipts:** less requests and proper handling of deleted receipts ([8811568](https://github.com/PeerioTechnologies/peerio-icebear/commit/8811568))
* **search:** remember search query ([294b596](https://github.com/PeerioTechnologies/peerio-icebear/commit/294b596))
* **security:** use payload as a source of truth for message attachments ([a4c20ef](https://github.com/PeerioTechnologies/peerio-icebear/commit/a4c20ef))
* **security:** username spoof protections ([c85c20c](https://github.com/PeerioTechnologies/peerio-icebear/commit/c85c20c))
* **serverWarning:** restore token ([d23a10f](https://github.com/PeerioTechnologies/peerio-icebear/commit/d23a10f))
* **settings:** save settings ([7c734ec](https://github.com/PeerioTechnologies/peerio-icebear/commit/7c734ec))
* **settings:** settings keg properties renamed on server ([ff5700e](https://github.com/PeerioTechnologies/peerio-icebear/commit/ff5700e))
* **sign:** typo ([6b379f1](https://github.com/PeerioTechnologies/peerio-icebear/commit/6b379f1))
* **socket:** remove potentially harmful reset function ([a5d34c5](https://github.com/PeerioTechnologies/peerio-icebear/commit/a5d34c5))
* **socket:** socket.io import fix ([6d5d117](https://github.com/PeerioTechnologies/peerio-icebear/commit/6d5d117))
* **socket:** upate state on disconnect - order ([e7ebd94](https://github.com/PeerioTechnologies/peerio-icebear/commit/e7ebd94))
* **socket:** update state on disconnect ([33fdd7e](https://github.com/PeerioTechnologies/peerio-icebear/commit/33fdd7e))
* **sounds:** improve receive sound notification logic ([2f28619](https://github.com/PeerioTechnologies/peerio-icebear/commit/2f28619))
* **stability:** reset socket on login error ([9e842b4](https://github.com/PeerioTechnologies/peerio-icebear/commit/9e842b4))
* **systemWarnings:** support shift ([8dd2e35](https://github.com/PeerioTechnologies/peerio-icebear/commit/8dd2e35))
* **tinydb:** don't decrypt empty values ([d46d8ef](https://github.com/PeerioTechnologies/peerio-icebear/commit/d46d8ef))
* **tinydb:** guard key parameter ([3dde898](https://github.com/PeerioTechnologies/peerio-icebear/commit/3dde898))
* **tinydb:** scope system db file name so it won't conflict with any username ([01e3341](https://github.com/PeerioTechnologies/peerio-icebear/commit/01e3341))
* **tofu:** better make it observable ([d7157a8](https://github.com/PeerioTechnologies/peerio-icebear/commit/d7157a8))
* **tofu:** fixed tofu validation ([913d8c9](https://github.com/PeerioTechnologies/peerio-icebear/commit/913d8c9))
* **tofu:** tofu verification fix ([1c27aa8](https://github.com/PeerioTechnologies/peerio-icebear/commit/1c27aa8))
* **tracker:** safe update tracker handler calls ([e615291](https://github.com/PeerioTechnologies/peerio-icebear/commit/e615291))
* **upload:** one-chunk files properly report lastChunk flag ([fd087b2](https://github.com/PeerioTechnologies/peerio-icebear/commit/fd087b2))
* **user:** kegKey must have been renamed to overrideKey accidentally ([ad63ef0](https://github.com/PeerioTechnologies/peerio-icebear/commit/ad63ef0))
* **user:** pad passhprase in serializeAuthData ([#22](https://github.com/PeerioTechnologies/peerio-icebear/issues/22)) ([1058d1d](https://github.com/PeerioTechnologies/peerio-icebear/commit/1058d1d))
* **util:** safari support for data view ([e0bc148](https://github.com/PeerioTechnologies/peerio-icebear/commit/e0bc148))
* **ux:** message grouping interval reduced to 10 minutes ([f0f8252](https://github.com/PeerioTechnologies/peerio-icebear/commit/f0f8252))
* **validation:** … actually throttle… ([76109b3](https://github.com/PeerioTechnologies/peerio-icebear/commit/76109b3))
* **validation:** allow action to return a message ([5cded0c](https://github.com/PeerioTechnologies/peerio-icebear/commit/5cded0c))
* **validation:** correctly parse throttled requests ([70c26cb](https://github.com/PeerioTechnologies/peerio-icebear/commit/70c26cb))
* **validation:** fix error message trigger ([e5650d0](https://github.com/PeerioTechnologies/peerio-icebear/commit/e5650d0))
* **validation:** fix name — empty name is ‘’ ([8079ebc](https://github.com/PeerioTechnologies/peerio-icebear/commit/8079ebc))
* **validation:** handle undefined string ([eb328c3](https://github.com/PeerioTechnologies/peerio-icebear/commit/eb328c3))
* **validation:** more legible throttled call ([e77ef57](https://github.com/PeerioTechnologies/peerio-icebear/commit/e77ef57))
* **validation:** refactor ([c603068](https://github.com/PeerioTechnologies/peerio-icebear/commit/c603068))
* **validation:** refactor validation so it doesn't cache bad results ([9c83acf](https://github.com/PeerioTechnologies/peerio-icebear/commit/9c83acf))
* **validation:** remove timeout ([564ce7b](https://github.com/PeerioTechnologies/peerio-icebear/commit/564ce7b))
* **validation:** require + value equality ([137d2e9](https://github.com/PeerioTechnologies/peerio-icebear/commit/137d2e9))
* **validation:** return true ([9d0b142](https://github.com/PeerioTechnologies/peerio-icebear/commit/9d0b142))
* **validation:** scope fix ([4ad18e1](https://github.com/PeerioTechnologies/peerio-icebear/commit/4ad18e1))
* no resets when connected ([951e088](https://github.com/PeerioTechnologies/peerio-icebear/commit/951e088))
* **validation:** throttle server calls ([d746969](https://github.com/PeerioTechnologies/peerio-icebear/commit/d746969))
* account for minCollectionVersion weirdness ([01b7a9b](https://github.com/PeerioTechnologies/peerio-icebear/commit/01b7a9b))
* amount of chats to load after favs ([80c4348](https://github.com/PeerioTechnologies/peerio-icebear/commit/80c4348))
* catch passcode error w passphrase ([bb93c6b](https://github.com/PeerioTechnologies/peerio-icebear/commit/bb93c6b))
* chatName ([9e818e1](https://github.com/PeerioTechnologies/peerio-icebear/commit/9e818e1))
* contact import ([6ffb23f](https://github.com/PeerioTechnologies/peerio-icebear/commit/6ffb23f))
* contact lookup spam at login ([b89c97a](https://github.com/PeerioTechnologies/peerio-icebear/commit/b89c97a))
* contact sorting ([dfc645a](https://github.com/PeerioTechnologies/peerio-icebear/commit/dfc645a))
* file blob download retry ([18811e3](https://github.com/PeerioTechnologies/peerio-icebear/commit/18811e3))
* limit retry counts of file remove ([b61b286](https://github.com/PeerioTechnologies/peerio-icebear/commit/b61b286))
* make sure named kegs always have allowEmpty flag ([6af2132](https://github.com/PeerioTechnologies/peerio-icebear/commit/6af2132))
* new file sharing ([b1fd378](https://github.com/PeerioTechnologies/peerio-icebear/commit/b1fd378))
* **validation:** undefined for pending requests ([3e3cfe9](https://github.com/PeerioTechnologies/peerio-icebear/commit/3e3cfe9))
* quick fix ([b0c8d02](https://github.com/PeerioTechnologies/peerio-icebear/commit/b0c8d02))
* receipt verification ([6f7c6df](https://github.com/PeerioTechnologies/peerio-icebear/commit/6f7c6df))
* ups ([f239923](https://github.com/PeerioTechnologies/peerio-icebear/commit/f239923))
* **validation:** throttling, again ([557b162](https://github.com/PeerioTechnologies/peerio-icebear/commit/557b162))
* **validation:** translation strings ([c84b172](https://github.com/PeerioTechnologies/peerio-icebear/commit/c84b172))
* **validation:** uniform type ([f417d6d](https://github.com/PeerioTechnologies/peerio-icebear/commit/f417d6d))
* **warnings:** don't display server warning with invalid key ([3662090](https://github.com/PeerioTechnologies/peerio-icebear/commit/3662090))
* **warnings:** failsafe server warning clear ([756e47f](https://github.com/PeerioTechnologies/peerio-icebear/commit/756e47f))
* **warnings:** fix duplicates and late subscription ([d8be158](https://github.com/PeerioTechnologies/peerio-icebear/commit/d8be158))
* **warnings:** fix server warnings not showing ([4ff734f](https://github.com/PeerioTechnologies/peerio-icebear/commit/4ff734f))
* **warnings:** prevent duplicate server warnings to appear on bad connections ([be8f933](https://github.com/PeerioTechnologies/peerio-icebear/commit/be8f933))
* **warnings:** server warnings constructor typo ([7e2ac6f](https://github.com/PeerioTechnologies/peerio-icebear/commit/7e2ac6f))
* **warnings:** show snackbars for longer ([02b9437](https://github.com/PeerioTechnologies/peerio-icebear/commit/02b9437))
* **warnings:** small thinngs ([fc86057](https://github.com/PeerioTechnologies/peerio-icebear/commit/fc86057))
* remove unused fs ([5d4c8a5](https://github.com/PeerioTechnologies/peerio-icebear/commit/5d4c8a5))
* small but mighty ([aaa60b8](https://github.com/PeerioTechnologies/peerio-icebear/commit/aaa60b8))
* typo ([2563930](https://github.com/PeerioTechnologies/peerio-icebear/commit/2563930))
* update data read status based on user focus ([18e209c](https://github.com/PeerioTechnologies/peerio-icebear/commit/18e209c))


### Features

* **account:** account delete reaction support ([43548d3](https://github.com/PeerioTechnologies/peerio-icebear/commit/43548d3))
* **account:** deleteAccount properly handles errors, generates warnings, returns promise ([e9821d7](https://github.com/PeerioTechnologies/peerio-icebear/commit/e9821d7))
* **auth:** create account ([3e3e93d](https://github.com/PeerioTechnologies/peerio-icebear/commit/3e3e93d))
* **auth:** encrypt/decrypt auth data with passcode ([39370ad](https://github.com/PeerioTechnologies/peerio-icebear/commit/39370ad))
* **auth:** socket supports 'authenticated' event and state ([c7e79b9](https://github.com/PeerioTechnologies/peerio-icebear/commit/c7e79b9))
* **avatar:** signing key hashing for avatar color ([13b6775](https://github.com/PeerioTechnologies/peerio-icebear/commit/13b6775))
* **avatars:** avatars ([e50f40c](https://github.com/PeerioTechnologies/peerio-icebear/commit/e50f40c))
* **chat:** adaptive unread counter clear ([7439525](https://github.com/PeerioTechnologies/peerio-icebear/commit/7439525))
* **chat:** always load all updates in all chats ([f3373cf](https://github.com/PeerioTechnologies/peerio-icebear/commit/f3373cf))
* **chat:** canSendAck Ack spam prevention api ([e82d87f](https://github.com/PeerioTechnologies/peerio-icebear/commit/e82d87f))
* **chat:** chat header/rename support ([7f320e6](https://github.com/PeerioTechnologies/peerio-icebear/commit/7f320e6))
* **chat:** chat hide/upload support ([5a3d0ff](https://github.com/PeerioTechnologies/peerio-icebear/commit/5a3d0ff))
* **chat:** chat name prefers full names over usernames ([f93d2f6](https://github.com/PeerioTechnologies/peerio-icebear/commit/f93d2f6))
* **chat:** chat watchlist - makes sure hidden chats only pop when there are meaningful changes in them(messages) ([b03a4de](https://github.com/PeerioTechnologies/peerio-icebear/commit/b03a4de))
* **chat:** chats start with automatic message ([ec75a1a](https://github.com/PeerioTechnologies/peerio-icebear/commit/ec75a1a))
* **chat:** fav/hidden chats, smart chat list loading ([682883f](https://github.com/PeerioTechnologies/peerio-icebear/commit/682883f))
* **chat:** grouped messages calculation ([ff60d91](https://github.com/PeerioTechnologies/peerio-icebear/commit/ff60d91))
* **chat:** last message snippet computed ([05b75b0](https://github.com/PeerioTechnologies/peerio-icebear/commit/05b75b0))
* **chat:** limit amount of chats to load ([6b63098](https://github.com/PeerioTechnologies/peerio-icebear/commit/6b63098))
* **chat:** message date separator support ([b12366c](https://github.com/PeerioTechnologies/peerio-icebear/commit/b12366c))
* **chat:** new messages marker support ([51aaa24](https://github.com/PeerioTechnologies/peerio-icebear/commit/51aaa24))
* **chat:** preload most recent message ([379aa20](https://github.com/PeerioTechnologies/peerio-icebear/commit/379aa20))
* **chat:** read receipts ([90d0675](https://github.com/PeerioTechnologies/peerio-icebear/commit/90d0675))
* **chat:** retry support ([076fab3](https://github.com/PeerioTechnologies/peerio-icebear/commit/076fab3))
* **chat:** sort chatlist on starring chats ([300c29a](https://github.com/PeerioTechnologies/peerio-icebear/commit/300c29a))
* **chat:** store system message metadata in keg props ([725e559](https://github.com/PeerioTechnologies/peerio-icebear/commit/725e559))
* **chat:** tweak page size for more comfortable chat experience ([5385583](https://github.com/PeerioTechnologies/peerio-icebear/commit/5385583))
* **chat:** ui props on message ([1909265](https://github.com/PeerioTechnologies/peerio-icebear/commit/1909265))
* **chats:** chat store ([0a79630](https://github.com/PeerioTechnologies/peerio-icebear/commit/0a79630))
* **chats:** dynamic chat sorting based on unread items ([09833e9](https://github.com/PeerioTechnologies/peerio-icebear/commit/09833e9))
* **chats:** find a chat with existing participants ([4477edd](https://github.com/PeerioTechnologies/peerio-icebear/commit/4477edd))
* **chats:** makes icebear aware about specific view client app is in to trigger receipts etc when appropriate ([1fef546](https://github.com/PeerioTechnologies/peerio-icebear/commit/1fef546))
* **chats:** option to sort chats 'unread first' on/off ([3846188](https://github.com/PeerioTechnologies/peerio-icebear/commit/3846188))
* **chatstore:** chatStore.hidingChat property to prevent spam clicking on ui 'hide' button ([0aea914](https://github.com/PeerioTechnologies/peerio-icebear/commit/0aea914))
* **ci:** add circle.yml ([60a78a3](https://github.com/PeerioTechnologies/peerio-icebear/commit/60a78a3))
* **clock:** dispose() for Clock ([d3ef650](https://github.com/PeerioTechnologies/peerio-icebear/commit/d3ef650))
* **config:** move chunk size to fs config ([bf35b33](https://github.com/PeerioTechnologies/peerio-icebear/commit/bf35b33))
* **contact:** contact model ([abf1953](https://github.com/PeerioTechnologies/peerio-icebear/commit/abf1953))
* **contact:** contact whenLoaded function + load retry ([78600ff](https://github.com/PeerioTechnologies/peerio-icebear/commit/78600ff))
* **contact:** Contact.usernameTag ([c3fd2b3](https://github.com/PeerioTechnologies/peerio-icebear/commit/c3fd2b3))
* **contact:** fullName property ([6629f59](https://github.com/PeerioTechnologies/peerio-icebear/commit/6629f59))
* **contact:** fullNameLower property for search purposes ([2fb6efb](https://github.com/PeerioTechnologies/peerio-icebear/commit/2fb6efb))
* **contact:** utility functions for contact loading ([47a4153](https://github.com/PeerioTechnologies/peerio-icebear/commit/47a4153))
* **contacts:** add invited contact when they join ([563faae](https://github.com/PeerioTechnologies/peerio-icebear/commit/563faae))
* **contacts:** contacts support ([06c5da4](https://github.com/PeerioTechnologies/peerio-icebear/commit/06c5da4))
* **contacts:** contactStore.filter(token, [collection]) smart user search ([59ecafe](https://github.com/PeerioTechnologies/peerio-icebear/commit/59ecafe))
* **contacts:** contactStore.invite(email) ([8b1dbb1](https://github.com/PeerioTechnologies/peerio-icebear/commit/8b1dbb1))
* **contacts:** delete invite ([d1c1ff3](https://github.com/PeerioTechnologies/peerio-icebear/commit/d1c1ff3))
* **contacts:** import ([782e031](https://github.com/PeerioTechnologies/peerio-icebear/commit/782e031))
* **core:** deleted and blacklisted account support ([13fff3e](https://github.com/PeerioTechnologies/peerio-icebear/commit/13fff3e))
* **core:** most recently used [anything] support ([9a02a9a](https://github.com/PeerioTechnologies/peerio-icebear/commit/9a02a9a))
* **core:** observable clock ([329ed8f](https://github.com/PeerioTechnologies/peerio-icebear/commit/329ed8f))
* **crypto:** add asymmetric key generation ([2217ae3](https://github.com/PeerioTechnologies/peerio-icebear/commit/2217ae3))
* **crypto:** add functions to pad/unpad passphrase ([#11](https://github.com/PeerioTechnologies/peerio-icebear/issues/11)) ([23b0b8e](https://github.com/PeerioTechnologies/peerio-icebear/commit/23b0b8e))
* **crypto:** add ghost key derivation & hash operations + tests ([6692f88](https://github.com/PeerioTechnologies/peerio-icebear/commit/6692f88))
* **crypto:** add signing keys generation ([e4715cb](https://github.com/PeerioTechnologies/peerio-icebear/commit/e4715cb))
* **crypto:** add symmetric encryption ([9131a82](https://github.com/PeerioTechnologies/peerio-icebear/commit/9131a82))
* **crypto:** assymetric shared key cache ([868bbbe](https://github.com/PeerioTechnologies/peerio-icebear/commit/868bbbe))
* **crypto:** cache keys ([4edeef5](https://github.com/PeerioTechnologies/peerio-icebear/commit/4edeef5))
* **crypto:** crypto keys module ([ebfb37e](https://github.com/PeerioTechnologies/peerio-icebear/commit/ebfb37e))
* **crypto:** full public crypto with optimized functions ([0befa8f](https://github.com/PeerioTechnologies/peerio-icebear/commit/0befa8f))
* **crypto:** node PRNG support ([f75d53a](https://github.com/PeerioTechnologies/peerio-icebear/commit/f75d53a))
* **crypto:** own random bytes function ([c5e6aa4](https://github.com/PeerioTechnologies/peerio-icebear/commit/c5e6aa4))
* **crypto:** passphrase generator ([f51603f](https://github.com/PeerioTechnologies/peerio-icebear/commit/f51603f))
* **crypto:** sign verify ([9aa36b4](https://github.com/PeerioTechnologies/peerio-icebear/commit/9aa36b4))
* **cryptoUtil:**  string to hex ([2eee003](https://github.com/PeerioTechnologies/peerio-icebear/commit/2eee003))
* **db:** tests ([9546808](https://github.com/PeerioTechnologies/peerio-icebear/commit/9546808))
* **digest:** minimalistic digest ([b2f8b6e](https://github.com/PeerioTechnologies/peerio-icebear/commit/b2f8b6e))
* **errors:** handle 434 error ([1f1284a](https://github.com/PeerioTechnologies/peerio-icebear/commit/1f1284a))
* **file:** set shared state of the file ([f588ea0](https://github.com/PeerioTechnologies/peerio-icebear/commit/f588ea0))
* **files:** confirmation snackbar when sharing files from file tab ([74fa954](https://github.com/PeerioTechnologies/peerio-icebear/commit/74fa954))
* **files:** custom filename ([cae5ff6](https://github.com/PeerioTechnologies/peerio-icebear/commit/cae5ff6))
* **files:** delete cached file ([8129dfe](https://github.com/PeerioTechnologies/peerio-icebear/commit/8129dfe))
* **files:** disable sharing of incomplete files ([16241e9](https://github.com/PeerioTechnologies/peerio-icebear/commit/16241e9))
* **files:** download ([fb2f111](https://github.com/PeerioTechnologies/peerio-icebear/commit/fb2f111))
* **files:** download automatic resume ([5ff4b0f](https://github.com/PeerioTechnologies/peerio-icebear/commit/5ff4b0f))
* **files:** drop to chat ([7f054c5](https://github.com/PeerioTechnologies/peerio-icebear/commit/7f054c5))
* **files:** extend file store with selection functions and props ([9f2c0f3](https://github.com/PeerioTechnologies/peerio-icebear/commit/9f2c0f3))
* **files:** failsafe logic ([21c9776](https://github.com/PeerioTechnologies/peerio-icebear/commit/21c9776))
* **files:** file sharing ([c7a2d54](https://github.com/PeerioTechnologies/peerio-icebear/commit/c7a2d54))
* **files:** file upload resume ([c7dc806](https://github.com/PeerioTechnologies/peerio-icebear/commit/c7dc806))
* **files:** get cache list ([e692779](https://github.com/PeerioTechnologies/peerio-icebear/commit/e692779))
* **files:** name filter/search support ([ba29ad5](https://github.com/PeerioTechnologies/peerio-icebear/commit/ba29ad5))
* **files:** prevent uploading files over quota ([6c36225](https://github.com/PeerioTechnologies/peerio-icebear/commit/6c36225))
* **files:** rename api ([e772c24](https://github.com/PeerioTechnologies/peerio-icebear/commit/e772c24))
* **files:** return file keg for uploadAndShare ([2ff8169](https://github.com/PeerioTechnologies/peerio-icebear/commit/2ff8169))
* **files:** return file keg for uploadAndShare ([f341a43](https://github.com/PeerioTechnologies/peerio-icebear/commit/f341a43))
* **files:** selected files counter ([808d59e](https://github.com/PeerioTechnologies/peerio-icebear/commit/808d59e))
* **files:** shareable files support functions ([4c5df90](https://github.com/PeerioTechnologies/peerio-icebear/commit/4c5df90))
* **files:** support deleteAfterUpload flag on chats ([e56ff8e](https://github.com/PeerioTechnologies/peerio-icebear/commit/e56ff8e))
* **files:** unread counter ([28c14bb](https://github.com/PeerioTechnologies/peerio-icebear/commit/28c14bb))
* **files:** upload to chat ([4fa9545](https://github.com/PeerioTechnologies/peerio-icebear/commit/4fa9545))
* **ghost:** attach files ([afb5808](https://github.com/PeerioTechnologies/peerio-icebear/commit/afb5808))
* **ghost:** sort, to be re-defined as per design (?) ([2ab1859](https://github.com/PeerioTechnologies/peerio-icebear/commit/2ab1859))
* **helpers:** dynamic map array ([962cad7](https://github.com/PeerioTechnologies/peerio-icebear/commit/962cad7))
* **keg:** loading/saving observable state for base Keg ([955f014](https://github.com/PeerioTechnologies/peerio-icebear/commit/955f014))
* **keg:** prop support ([f469809](https://github.com/PeerioTechnologies/peerio-icebear/commit/f469809))
* **kegs:** SyncedKeg - new class for easy use of synced named kegs ([62d8e4f](https://github.com/PeerioTechnologies/peerio-icebear/commit/62d8e4f))
* **legacy:** legacy contact import ([be9f9d7](https://github.com/PeerioTechnologies/peerio-icebear/commit/be9f9d7))
* **lib:** check file owner for file sharing ([47512e4](https://github.com/PeerioTechnologies/peerio-icebear/commit/47512e4))
* **lib:** export FileNonceGenerator ([9d5a8b0](https://github.com/PeerioTechnologies/peerio-icebear/commit/9d5a8b0))
* **lib:** file name utilities ([b8db9cb](https://github.com/PeerioTechnologies/peerio-icebear/commit/b8db9cb))
* **lib:** file name utilities ([da6ac91](https://github.com/PeerioTechnologies/peerio-icebear/commit/da6ac91))
* **lib:** passcode validation ([439cd77](https://github.com/PeerioTechnologies/peerio-icebear/commit/439cd77))
* **lib:** queue timeout ([621ea5c](https://github.com/PeerioTechnologies/peerio-icebear/commit/621ea5c))
* **lib:** validation ([7bcdcac](https://github.com/PeerioTechnologies/peerio-icebear/commit/7bcdcac))
* **login:** don't derive passcode if authKeys are cached ([50efb48](https://github.com/PeerioTechnologies/peerio-icebear/commit/50efb48))
* **login:** lastAuthenticated ([b70ce84](https://github.com/PeerioTechnologies/peerio-icebear/commit/b70ce84))
* **login:** login with passcode ([83a71eb](https://github.com/PeerioTechnologies/peerio-icebear/commit/83a71eb))
* **login:** save passcode ([0a3e973](https://github.com/PeerioTechnologies/peerio-icebear/commit/0a3e973))
* **message:** add message ([2a3bdc5](https://github.com/PeerioTechnologies/peerio-icebear/commit/2a3bdc5))
* **message-kegs:** load all ([962fa62](https://github.com/PeerioTechnologies/peerio-icebear/commit/962fa62))
* **messaging:** ack message support ([e0e61b0](https://github.com/PeerioTechnologies/peerio-icebear/commit/e0e61b0))
* **messaging:** incoming chat ([5b44aec](https://github.com/PeerioTechnologies/peerio-icebear/commit/5b44aec))
* **messaging:** lookup by email ([eab30a6](https://github.com/PeerioTechnologies/peerio-icebear/commit/eab30a6))
* **migration:** ability to generate publicKeyString for tests ([89eafb9](https://github.com/PeerioTechnologies/peerio-icebear/commit/89eafb9))
* **migration:** legacy accounts migrator ([35ff0ee](https://github.com/PeerioTechnologies/peerio-icebear/commit/35ff0ee))
* **mobile:** add helper methods for mobile fs ([540a97a](https://github.com/PeerioTechnologies/peerio-icebear/commit/540a97a))
* **mobile:** add passcode existence check ([e37db1a](https://github.com/PeerioTechnologies/peerio-icebear/commit/e37db1a))
* **net:** no more hanging requests ([69ece4a](https://github.com/PeerioTechnologies/peerio-icebear/commit/69ece4a))
* **network:** add connected observable ([64216ee](https://github.com/PeerioTechnologies/peerio-icebear/commit/64216ee))
* **network:** handle throttling ([358e024](https://github.com/PeerioTechnologies/peerio-icebear/commit/358e024))
* **passcode:** persist skipping passcode ([376e3fa](https://github.com/PeerioTechnologies/peerio-icebear/commit/376e3fa))
* **paywall:** paywall errors via systemWarnings ([9e266be](https://github.com/PeerioTechnologies/peerio-icebear/commit/9e266be))
* **profile:** email editor support ([530e01c](https://github.com/PeerioTechnologies/peerio-icebear/commit/530e01c))
* **profile:** email update ([d45dcb5](https://github.com/PeerioTechnologies/peerio-icebear/commit/d45dcb5))
* **profile:** profile load/save ([042dfa3](https://github.com/PeerioTechnologies/peerio-icebear/commit/042dfa3))
* **props:** props support for kegs ([bc0b2d6](https://github.com/PeerioTechnologies/peerio-icebear/commit/bc0b2d6))
* **queue:** error result support for queue tasks ([91fef6c](https://github.com/PeerioTechnologies/peerio-icebear/commit/91fef6c))
* **quota:** quota helpers ([fd9257e](https://github.com/PeerioTechnologies/peerio-icebear/commit/fd9257e))
* **quotas:** methods to check for quotas ([1a0b9af](https://github.com/PeerioTechnologies/peerio-icebear/commit/1a0b9af))
* **quotas:** quotas keg support ([d879019](https://github.com/PeerioTechnologies/peerio-icebear/commit/d879019))
* **react-native:** replace crypto with shim ([9852e9e](https://github.com/PeerioTechnologies/peerio-icebear/commit/9852e9e))
* **receipts:** finalized ([4d5d0ec](https://github.com/PeerioTechnologies/peerio-icebear/commit/4d5d0ec))
* **receipts:** remove duplicate receipt kegs if any ([08fd6ba](https://github.com/PeerioTechnologies/peerio-icebear/commit/08fd6ba))
* **retry:** failsafe retry with increasing interval and retry count limit ([a566780](https://github.com/PeerioTechnologies/peerio-icebear/commit/a566780))
* **security:** identity fingerprint support ([b47c05f](https://github.com/PeerioTechnologies/peerio-icebear/commit/b47c05f))
* **security:** use safer file extension routine ([182048d](https://github.com/PeerioTechnologies/peerio-icebear/commit/182048d))
* **settings:** promo email newsletter setting ([92d660c](https://github.com/PeerioTechnologies/peerio-icebear/commit/92d660c))
* **settings:** settings keg support ([8957eff](https://github.com/PeerioTechnologies/peerio-icebear/commit/8957eff))
* **sharing:** new keg sharing logic ([9ec89d1](https://github.com/PeerioTechnologies/peerio-icebear/commit/9ec89d1))
* **sign:** encrypted keg signing ([1662a71](https://github.com/PeerioTechnologies/peerio-icebear/commit/1662a71))
* **signin:** working sign in ([3764086](https://github.com/PeerioTechnologies/peerio-icebear/commit/3764086))
* **signup:** fully failsafe signup process ([18c7dd5](https://github.com/PeerioTechnologies/peerio-icebear/commit/18c7dd5))
* **socket:** add socket subscriptions ([21e4a96](https://github.com/PeerioTechnologies/peerio-icebear/commit/21e4a96))
* **socket:** prevent /auth/* socket calls on not authenticated connection ([89eeb4c](https://github.com/PeerioTechnologies/peerio-icebear/commit/89eeb4c))
* **socket:** socket reconnect information goodies ([cb21345](https://github.com/PeerioTechnologies/peerio-icebear/commit/cb21345))
* **sounds:** send-receive sounds ([8a83945](https://github.com/PeerioTechnologies/peerio-icebear/commit/8a83945))
* **stability:** action retry helper ([22a7d7e](https://github.com/PeerioTechnologies/peerio-icebear/commit/22a7d7e))
* **stability:** fail-safe profile loading ([84cb4a9](https://github.com/PeerioTechnologies/peerio-icebear/commit/84cb4a9))
* **storage:** add storage injection ([4b2b4ee](https://github.com/PeerioTechnologies/peerio-icebear/commit/4b2b4ee))
* **storage:** TinyDb encryption ([3edc39f](https://github.com/PeerioTechnologies/peerio-icebear/commit/3edc39f))
* **sync:** complete and new collection version contract compatible SyncedKeg ([3396c4f](https://github.com/PeerioTechnologies/peerio-icebear/commit/3396c4f))
* **systemWarning:** expand serverWarning to be more generic ([a300a23](https://github.com/PeerioTechnologies/peerio-icebear/commit/a300a23))
* **tinydb:** getAllKeys support ([4020df5](https://github.com/PeerioTechnologies/peerio-icebear/commit/4020df5))
* **tinydb:** support removing keys ([18cc0d2](https://github.com/PeerioTechnologies/peerio-icebear/commit/18cc0d2))
* **tofu:** flag contacts ([41be5cc](https://github.com/PeerioTechnologies/peerio-icebear/commit/41be5cc))
* **tofu:** tofu ([f26411c](https://github.com/PeerioTechnologies/peerio-icebear/commit/f26411c))
* **ui:** expand systemWarnings to support global errors ([2b7855f](https://github.com/PeerioTechnologies/peerio-icebear/commit/2b7855f))
* **ui:** extended preview for ghost body ([94aa85a](https://github.com/PeerioTechnologies/peerio-icebear/commit/94aa85a))
* **ui:** extended preview for ghost body ([2f9e9b3](https://github.com/PeerioTechnologies/peerio-icebear/commit/2f9e9b3))
* **ui:** letter function for contact ([9641940](https://github.com/PeerioTechnologies/peerio-icebear/commit/9641940))
* **ui:** show email confirmation sent snackbar when adding new email ([#13](https://github.com/PeerioTechnologies/peerio-icebear/issues/13)) ([cda7035](https://github.com/PeerioTechnologies/peerio-icebear/commit/cda7035))
* **ui:** skylar formatted fingerprint ([1bc9145](https://github.com/PeerioTechnologies/peerio-icebear/commit/1bc9145))
* **ui:** skylar formatted fingerprint ([22480aa](https://github.com/PeerioTechnologies/peerio-icebear/commit/22480aa))
* **ui:** skylar formatted fingerprint ([f9c31dc](https://github.com/PeerioTechnologies/peerio-icebear/commit/f9c31dc))
* **workers:** make sign detach and verify async ([9ba2fb8](https://github.com/PeerioTechnologies/peerio-icebear/commit/9ba2fb8))
* add secureWithTouchID observable ([#24](https://github.com/PeerioTechnologies/peerio-icebear/issues/24)) ([49ce578](https://github.com/PeerioTechnologies/peerio-icebear/commit/49ce578))
* **ui:** validation export for login username ([6936b1a](https://github.com/PeerioTechnologies/peerio-icebear/commit/6936b1a))
* **updates:** file store keg update support ([b616a77](https://github.com/PeerioTechnologies/peerio-icebear/commit/b616a77))
* **updates:** keg updates support ([71b01dd](https://github.com/PeerioTechnologies/peerio-icebear/commit/71b01dd))
* **user:** account migration ([7f37a90](https://github.com/PeerioTechnologies/peerio-icebear/commit/7f37a90))
* **user:** autologinEnabled observable ([9e127ed](https://github.com/PeerioTechnologies/peerio-icebear/commit/9e127ed))
* **user:** current user export for modules that can't require User class ([9182887](https://github.com/PeerioTechnologies/peerio-icebear/commit/9182887))
* **user:** delete account api ([ddc4a36](https://github.com/PeerioTechnologies/peerio-icebear/commit/ddc4a36))
* **user:** self-updating quota and profile data ([8d0c540](https://github.com/PeerioTechnologies/peerio-icebear/commit/8d0c540))
* **user:** server warnings ([5a627f0](https://github.com/PeerioTechnologies/peerio-icebear/commit/5a627f0))
* **user:** silent legacy account migration ([b84c96f](https://github.com/PeerioTechnologies/peerio-icebear/commit/b84c96f))
* **util:** observable timer to make timer coutners ([f5563ee](https://github.com/PeerioTechnologies/peerio-icebear/commit/f5563ee))
* **util:** prombservable - promise wrapper for observable ([8168ac9](https://github.com/PeerioTechnologies/peerio-icebear/commit/8168ac9))
* **validation:** add ability to reset validation state ([9d8150a](https://github.com/PeerioTechnologies/peerio-icebear/commit/9d8150a))
* **validation:** add value equality + docs ([e6d9349](https://github.com/PeerioTechnologies/peerio-icebear/commit/e6d9349))
* devicetokens ([#14](https://github.com/PeerioTechnologies/peerio-icebear/issues/14)) ([56ba6eb](https://github.com/PeerioTechnologies/peerio-icebear/commit/56ba6eb))
* support for desktop notifications ([#12](https://github.com/PeerioTechnologies/peerio-icebear/issues/12)) ([6ea719c](https://github.com/PeerioTechnologies/peerio-icebear/commit/6ea719c))
* time store ([1d36f8b](https://github.com/PeerioTechnologies/peerio-icebear/commit/1d36f8b))
* **validation:** login validation functions ([1d1beae](https://github.com/PeerioTechnologies/peerio-icebear/commit/1d1beae))
* **validation:** refactor ([dd456fd](https://github.com/PeerioTechnologies/peerio-icebear/commit/dd456fd))
* **validation:** refactor validation a bit ([290b5ba](https://github.com/PeerioTechnologies/peerio-icebear/commit/290b5ba))
* **warnings:** custom action support for warning buttons ([efb4545](https://github.com/PeerioTechnologies/peerio-icebear/commit/efb4545))
* **warnings:** dismiss callback support for severe warnings ([24ee5fd](https://github.com/PeerioTechnologies/peerio-icebear/commit/24ee5fd))


### Performance Improvements

* **chat:** async message decryption ([9a0a97f](https://github.com/PeerioTechnologies/peerio-icebear/commit/9a0a97f))
* **chat:** don't try to send receipts when not needed ([2f1fa5c](https://github.com/PeerioTechnologies/peerio-icebear/commit/2f1fa5c))
* **chat:** effective initial chat list loading ([2edceb5](https://github.com/PeerioTechnologies/peerio-icebear/commit/2edceb5))
* **chat:** send operation improved to avoid jitter on render ([8cfc1d9](https://github.com/PeerioTechnologies/peerio-icebear/commit/8cfc1d9))
* **chatlist:** chatlist optimisation ([f96d0b6](https://github.com/PeerioTechnologies/peerio-icebear/commit/f96d0b6))
* **crypto:** scrypt proxy for worker implementation ([ab749d3](https://github.com/PeerioTechnologies/peerio-icebear/commit/ab749d3))
