const mailinator = require('mailinator-api');
const http = require('http');
const https = require('https');

const getConfirmationEmailAddress = (body) => {
    const regex = /https:\\\/\\\/hocuspocus.peerio.com\\\/confirm-address\\\/\w*/ig;
    let found = body.match(regex)[0];
    found = found.replace(/\\\//g, '/');

    return found;
};

const usernameChars = '0123456789abcdefghijklmnopqrstuvwxyz';
const getRandomUsername = () => {
    let username = '';
    for (let i = 0; i < 30; i++) {
        username += usernameChars[Math.floor(Math.random() * usernameChars.length)];
    }
    return username;
};

const confirmUserEmail = (user, done) => {
    mailinator.getMailinatorInboxJSON(
        process.env.PEERIO_ADMIN_EMAIL,
        process.env.MAILINATOR_KEY,
        (reply) => {
            const mailbox = JSON.parse(reply);
            const confirmationEmailId = mailbox.messages
                .find(x => x.subject.includes(user))
                .id;

            const emailUrl = `http://api.mailinator.com/api/email?id=${confirmationEmailId}&token=${process.env.MAILINATOR_KEY}`;

            let body = '';
            http.get(emailUrl, (res) => {
                res.on('data', (chunk) => { body += chunk; });
                res.on('error', (e) => done(e.message, 'failed'));
                res.on('end', () => {
                    const url = getConfirmationEmailAddress(body);
                    https.get(url, (resp) => {
                        resp.on('error', (e) => done(e.message, 'failed'));
                        resp.on('end', () => done());
                    });
                });
            });
        });
};

module.exports = { getRandomUsername, confirmUserEmail };
