#!/usr/bin/env bun

import { gitAi } from './ai';
import { retrieveUnstagedChanges } from './git';
import { handleSelection } from './prompt';

const diff = await retrieveUnstagedChanges();

const msg = (async (diff: string) => {
    const aiSuggestion = await gitAi(diff);

    handleSelection(aiSuggestion);
})(diff);
