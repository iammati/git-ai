#!/usr/bin/env bun

import simpleGit from 'simple-git';
import { gitAi } from './ai';
import { retrieveUnstagedChanges } from './git';
import { handleSelection } from './prompt';

const git = simpleGit();

(async (diff: string) => {
    const aiSuggestion = await gitAi(diff);

    handleSelection(git, aiSuggestion);
})(await retrieveUnstagedChanges(git));
