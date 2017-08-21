const { observable } = require('mobx');


/**
 * This is the place where Icebear can get various state information about client
 * and client can provide such information.
 * @namespace ClientApp
 * @public
 */
class ClientApp {
    /**
     * Set this flag when to help Icebear know if user is currently interacting with your app or not.
     * One example of how this affects Icebear behavior:
     * messages will not be marked as 'read' unless isFocused == true
     * @member {boolean} isFocused
     * @memberof ClientApp
     * @public
     */
    @observable isFocused = true;

    /**
     * Use this to let Icebear know if your app is currently showing any of the chats.
     * @member {boolean} isInChatsView
     * @memberof ClientApp
     * @public
     */
    @observable isInChatsView = false;

    /**
     * Use this to let Icebear know if your app is currently showing main file view.
     * @member {boolean} isInFilesView
     * @memberof ClientApp
     * @public
     */
    @observable isInFilesView = false;

    /**
     * Icebear sets this flag.
     * @member {boolean} clientVersionDeprecated
     * @memberof ClientApp
     * @public
     */
    @observable clientVersionDeprecated = false;

    /**
     * UI should listen to this and request entering of 2fa code from user and then pass ot back to icebear.
     * @member {TwoFARequest} active2FARequest
     * @public
     */
    @observable active2FARequest = null;

    /**
     * Creates new 2fa request for UI. UI is supposed to show 2fa dialog to user and pass entered code back to icebear.
     * @param {string} type - 'login', 'backupCodes', 'disable' one of the reasons for 2fa request
     * @param {Function<string>} submitCallback - will be called with whatever user entered argument
     * @param {?Function} cancelCallback - some requests are cancelable
     * @protected
     */
    create2FARequest(type, submitCallback, cancelCallback) {
        if (!['login', 'backupCodes', 'disable'].includes(type)) throw new Error('Unknown 2fa request type: ', type);
        // deliberately overwriting existing request
        // this should never happen anyway, if it does - it's safer to overwrite
        const cancelable = type !== 'login';
        this.active2FARequest = {
            cancelable,
            type,
            submit: (code) => {
                this.active2FARequest = null;
                submitCallback(code);
            },
            cancel: () => {
                if (!cancelable) {
                    throw new Error('This 2fa request is not cancelable.');
                }
                this.active2FARequest = null;
                cancelCallback();
            }

        };
    }
}

module.exports = new ClientApp();
