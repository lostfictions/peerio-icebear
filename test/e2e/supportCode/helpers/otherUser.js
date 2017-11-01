const otherUser = {
    id: null
};

const assignRegisteredUser = (data) => {
    otherUser.id = data.username;
};

module.exports = { otherUser, assignRegisteredUser };
