import dotenv from 'dotenv';
import { errorExit } from './logger';

const { NODE_ENV } = process.env;

dotenv.config({
    path: `.env${NODE_ENV ? '.' + NODE_ENV : ''}`,
});

const { OPENAI_API_KEY: key } = process.env

if ((key ?? '').length === 0) {
    errorExit('`OPENAI_API_KEY` environment variable is not set');
}

export const OPENAI_API_KEY = key;
