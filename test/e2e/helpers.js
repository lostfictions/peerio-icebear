const mailinator = require('mailinator-api');
const http = require('http');
const https = require('https');

const usernameChars = '0123456789abcdefghijklmnopqrstuvwxyz';

// generates 16-character random usernames
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
            const confirmationEmail = mailbox.messages
                .find(x => x.subject.includes(user))
                .id;

            console.log('email is:', confirmationEmail);

            const emailUrl = `http://api.mailinator.com/api/email?id=${confirmationEmail}&token=${process.env.MAILINATOR_KEY}`;

            let body = '';
            http
                .get(emailUrl, (res) => {
                    res.on('data', (chunk) => {
                        body += chunk;
                    });
                    res.on('end', () => {
                        const regex = /https:\\\/\\\/hocuspocus.peerio.com\\\/confirm-address\\\/\w*/ig;

                        let found = body.match(regex)[0];
                        found = found.replace(/\\\//g, '/');
                        console.log(found);

                        https
                            .get(found, (resp) => {
                                resp.on('data', (chunk) => {
                                    console.log(chunk.toString());
                                });
                                resp.on('end', () => done());
                                resp.on('error', (e) => console.log(e.message));
                            });
                    });
                })
                .on('error', (e) => done(e.message, 'failed'));
        });
};

module.exports = { getRandomUsername, confirmUserEmail };
