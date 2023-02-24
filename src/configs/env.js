import * as dotenv from 'dotenv'; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();

// eslint-disable-next-line no-undef
const {MAILUSER, PASSWORD, HOST} = process.env;

export const ENV = {
    user: MAILUSER,
    password: MAILPASSWORD,
    host: MAILHOST,
};

// console.log(ENV)
