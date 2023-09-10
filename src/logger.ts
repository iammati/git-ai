import pc from 'picocolors';

const prefix = '[ git-ai ]';

export const log = (...msg: string[]): void => console.log(`${pc.yellow(prefix)} ${msg.join('\n' + prefix + ' ')}`);
export const error = (...msg: string[]): void => console.error(`${pc.red(prefix)} ${pc.red(msg.join('\n' + prefix + ' '))}`);
export const errorExit = (...msg: string[]): never => {
    error(...msg);

    return process.exit(1);
};
