To use Icebear SDK you need to require its entry point at any time you need it.
Icebear will initialize whatever needs to be initialized, you just have to start the socket connection once,
whenever your application is ready.
```
const icebear = require('icebear');
icebear.socket.start();
```
Entry point exports all the public API you will need.