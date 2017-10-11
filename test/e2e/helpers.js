const http = require('http');
const https = require('https');

const confirmLabel = 'Confirm your account';
const newEmailLabel = 'confirm your new address';

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

const confirmUserEmail = (user, err, done) => {
    const inbox = `http://api.mailinator.com/api/inbox?to=${process.env.PEERIO_ADMIN_EMAIL}&token=${process.env.MAILINATOR_KEY}`;
    http.get(inbox, (response) => {
        let emails = '';
        response.on('data', (chunk) => { emails += chunk; });
        response.on('error', (e) => err(e.message));
        response.on('end', () => {
            const mailbox = JSON.parse(emails);
            const confirmationEmailId = mailbox.messages
                .find(x => x.subject.includes(user) &&
                    (x.subject.includes(confirmLabel) ||
                        x.subject.includes(newEmailLabel)))
                .id;

            const emailUrl = `http://api.mailinator.com/api/email?id=${confirmationEmailId}&token=${process.env.MAILINATOR_KEY}`;

            http.get(emailUrl, (res) => {
                let body = '';
                res.on('data', (chunk) => { body += chunk; });
                res.on('error', (e) => err(e.message));
                res.on('end', () => {
                    const url = getConfirmationEmailAddress(body);
                    https.get(url, (resp) => {
                        resp.on('data', () => { });
                        resp.on('error', (e) => err(e.message));
                        resp.on('end', () => done());
                    });
                });
            });
        });
    });
};

module.exports = { getRandomUsername, confirmUserEmail };
