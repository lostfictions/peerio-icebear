This document describes how to produce documentation best given our doc build pipeline.


- Use jsdoc syntax.
- Use linter from time to time - `npm run docs:lint`.
- Mark access level:
    - client api as `@public`,
    - api for internal icebear use as `@protected`,
    - module/class internal stuff as `@private`
- Observables and other decorators can't get parsed properly, so you have to write more tags
This is the absolute minimum for a properly parsed decorated property:
```
    /**
     * @member {?Message} mostRecentMessage
     * @memberof Chat
     * @instance
     * @public
     */
    @observable mostRecentMessage;
```
For decorated functions replace `@member {type} name` tag with `@function name`.
- Do not add a period before angle brackets in type description, even though jsdoc suggests it.
Incorrect: `@param {Array.<string>} name`
Correct: `@param {Array<string>} name`
- More > less, if you wonder if some tag is necessary or will be inferred ether check it or just add it.
- Don't use `@type` tag, id doesn't get parsed, use `@member {type}` or `@member {type} name`.
- Document class static properties inside class, even if you initialize them outside, otherwise weird global copies
will be created in the documentation.
- If you export singleton from a module, mark the class as `@namespace`
- Constructor params should be listed in the class comment, not in the constructor comment.
- Create virtual types in `src/typedefs.js` for object types.
- Arrow function class properties require `@function` tag
- Carefully document nullable types, add question mark in the beginning to define nullable - `@param {?string}`
- Always define optional params and default values like so `@param {string} [name='']`
