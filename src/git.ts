import { SimpleGit } from 'simple-git';
import { errorExit } from './logger';

const ignoredFiles = [
    'bun.lockb',
    'pnpm-lock.yaml',
    'yarn-lock.yaml',
    'package-lock.json',
    'composer.lock',
].map(filename => `:!${filename}`);

export const retrieveUnstagedChanges = async (git: SimpleGit): Promise<string|never> => {
    const diff = await git.diff(['--staged', '--', ...ignoredFiles]);

    if (diff.length === 0) {
        return errorExit(
            `Repository's staged-area looks empty. No diff found to make a summary of.`,
            `Use \`git add <file>\` to stage files and try again.`,
        );
    }

    return diff;
};
