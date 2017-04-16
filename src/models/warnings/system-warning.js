/**
 * Base/local class for warnings. Server warnings class inherits from it.
 */

class SystemWarning {

    /**
     * @param {string} content - localisation string key
     * @param {string} [title] - localisation string key
     * @param {object} data - variables to pass to peerio-translator when resolving content
     * @param {string} [level='medium'] - severity level, options [medium, severe]
     */
    constructor(content, title, data, level = 'medium') {
        this.content = content;
        this.title = title;
        this.data = data;
        this.level = level;
    }

    // override in child class if needed
    dispose() { }
}

module.exports = SystemWarning;
