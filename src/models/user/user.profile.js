const Profile = require('./profile');
const Quota = require('./quota');

module.exports = function mixUserRegisterModule() {
    const _profileKeg = new Profile(this.kegDb, this);
    const _quotasKeg = new Quota(this.kegDb, this);

    this.loadProfile = function() {
        console.log('Loading user profile.');
        return Promise.all([_profileKeg.load(), _quotasKeg.load()]);
    };

    this.saveProfile = function() {
        return _profileKeg.saveToServer();
    };

    // todo: move to quota keg, make computed
    this.canSendGhost = function() {
        const q = this.quotas;
        if (q && q.quotasLeft && q.quotasLeft.ghost) {
            const qTotal = q.quotasLeft.ghost.find(i => i.period === 'monthly');
            if (!qTotal) return true;
            return qTotal.limit > 0;
        }
        return true;
    };

    // todo: move to quota keg
    // todo: take chunk overhead into account
    this.canUploadFileSize = function(size) {
        const q = this.quotas;
        if (q && q.quotasLeft && q.quotasLeft.file) {
            const qTotal = q.quotasLeft.file.find(i => i.period === 'total');
            if (!qTotal) return true;
            return qTotal.limit > size;
        }
        return true;
    };
};
