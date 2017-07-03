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
}

module.exports = new ClientApp();
