import crypto from 'crypto';
import fs from 'fs';
import { SelectionItem, createSelection } from 'bun-promptx';
import { errorExit, log } from './logger';
import { SimpleGit } from 'simple-git';
import pc from 'picocolors';

const options: SelectionItem[] = [
    {
        text: 'Accept',
        description: 'Take the AI-suggestion',
    },
    {
        text: 'Run again',
        description: 'Run another AI-request on the same diff for different suggestion',
    },
    {
        text: 'Abort',
        description: 'Abort the AI-suggestion',
    },
];

const promptSelection = (suggestion: string): number | null => {
    console.log('\n', suggestion, '\n=====================\n');
    return createSelection(options).selectedIndex;
};

export const handleSelection = async (git: SimpleGit, suggestion: string, x: number = 0) => {
    const index = promptSelection(suggestion);

    switch (index) {
        case 0:
            const randomFilename = crypto.randomBytes(8).toString('hex');
            const filename = `/tmp/${randomFilename}`;
            fs.writeFileSync(filename, suggestion);

            Bun.spawn(['nano', filename], {
                stdin: 'inherit',
                stdout: 'inherit',
                stderr: 'inherit',
                onExit: (...e) => {
                    const modifiedSuggestion = fs.readFileSync(filename, 'utf-8');
                    if (modifiedSuggestion !== suggestion) {
                        log('Committing with modified message: ', pc.yellow(modifiedSuggestion));
                    } else {
                        log('Committing with message: ', pc.cyan(modifiedSuggestion));
                    }

                    fs.unlinkSync(filename);
                    git.commit(modifiedSuggestion);
                },
            });
            break;
        case 1:
            console.clear();
            const counter = x > 0 ? pc.yellow(` (x${x + 1})`) : '';
            log(`Running again...${counter}`);
            await handleSelection(git, suggestion, x + 1);
            break;
        case 2:
            errorExit('Aborted.');
            break;
        default:
            errorExit('Unknown error.');
    };
};
