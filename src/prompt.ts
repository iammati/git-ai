import { SelectionItem, createSelection } from 'bun-promptx';
import { errorExit, log } from './logger';
import simpleGit, { CommitResult, Response } from 'simple-git';

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

export const handleSelection = (suggestion: string) => {
    const index = promptSelection(suggestion);

    switch (index) {
        case 0:
            const git = simpleGit();
            git.commit(suggestion);
            log(`Committed with message: ${suggestion}`);
            break;
        case 1:
            log('Running again...');
            handleSelection(suggestion);
            break;
        case 2:
            errorExit('Aborted.');
            break;
        default:
            errorExit('Unknown error.');
    };
};
