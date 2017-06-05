/**
 * Base/local class for warnings. Server warnings class inherits from it.
 */
const { observable } = require('mobx');

class SystemWarning {

    static STATES = {
        QUEUED: 0, /* WILL_SHOW: 1,*/ SHOWING: 2, WILL_DISMISS: 3, DISMISSED: 4
    };

    @observable state = SystemWarning.STATES.QUEUED;
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

    show() {
        if (this.state !== SystemWarning.STATES.QUEUED) return;
        // this.state = SystemWarning.STATES.WILL_SHOW;
        // setTimeout(() => {
        this.state = SystemWarning.STATES.SHOWING;
        // }, 1000);
    }

    dismiss() {
        if (this.state > SystemWarning.STATES.SHOWING) return;
        this.state = SystemWarning.STATES.WILL_DISMISS;
        setTimeout(() => {
            this.dispose();
            this.state = SystemWarning.STATES.DISMISSED;
        }, 700);
    }

    autoDismiss() {
        if (this.state > SystemWarning.STATES.SHOWING) return;
        if (this.timer) return;
        this.timer = setTimeout(() => {
            this.dismiss();
            this.timer = null;
        }, 7000);
    }

    cancelAutoDismiss() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }
    /**
     *  Override in child class if needed.
     *  Will get called on warning dismiss.
     */
    dispose() { }
}

module.exports = SystemWarning;
