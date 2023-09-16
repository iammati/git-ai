import { spawnSync } from 'child_process';
import { SelectionItem, createSelection } from 'bun-promptx';
import { error, errorExit, log } from './logger';
import crypto from 'crypto';
import simpleGit, { SimpleGit } from 'simple-git';
import fs from 'fs';
import path from 'path';

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

export const handleSelection = (git: SimpleGit, suggestion: string) => {
    const index = promptSelection(suggestion);

    switch (index) {
        case 0:
            const randomFilename = crypto.randomBytes(8).toString('hex');
            const filename = path.join('/tmp', `${randomFilename}.txt`);
            fs.writeFileSync(filename, suggestion);

            const editorCommand = process.env.EDITOR || 'nano';
            const editorProcess = spawnSync(editorCommand, [filename], {
                stdio: 'inherit',
            });

            if (editorProcess.error) {
                error('Error opening the text editor:');
                return errorExit(editorProcess.error);
            }

            const modifiedSuggestion = fs.readFileSync(filename, 'utf-8');
            fs.unlinkSync(filename);

            git.commit(modifiedSuggestion);
            log('Committed with message:', modifiedSuggestion);

            break;
        case 1:
            log('Running again...');
            handleSelection(git, suggestion);
            break;
        case 2:
            errorExit('Aborted.');
            break;
        default:
            errorExit('Unknown error.');
    };
};
