Icebear exports configuration object that **you have to initialize with
some mandatory properties** and configure some optional ones.

The recommended pattern to deal with configuration:

1. Create `config.js` in source root of your project

```
    // import icebear config
    const config = require('icebear').config;

    // set and override properties
    config.icebearProperty = 'value';
    config.clientSpecificProperty = 'value'

    // and export extended config object in the end
    module.exports = config;
```

2. Require this config.js at your app startup so it extends Icebear config.