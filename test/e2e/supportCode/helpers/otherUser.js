const otherUser = {
    id: null
};

const assignOtherUserId = (data) => {
    otherUser.id = data.username;
};

module.exports = { otherUser, assignOtherUserId };
