There's two kinds of databases

- User's own database, always has id 'SELF' user can have only one of those.
- Shared 'Chat Databases'. All participants can read and write.

Kegs can be
- Regular - you get numeric auto-incremented Id for it and start writing to it.
- Named system kegs - server creates them and they have fixed name as Id.
- Named user kegs, like regular ones but user chooses any string id he wants.

Keg payload can be
- encrypted - entire payload is encrypted and stored as ArrayBuffer
- plaintext - stored as serialized JSON string, although might have separately encrypted parts inside