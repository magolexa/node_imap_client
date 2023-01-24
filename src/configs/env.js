import * as dotenv from 'dotenv'; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();

// eslint-disable-next-line no-undef
const {USER, PASSWORD, HOST} = process.env;

export const ENV = {
    user: USER,
    passwrod: PASSWORD,
    host: HOST,
};
