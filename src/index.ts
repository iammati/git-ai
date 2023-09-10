#!/usr/bin/env bun

import { gitAi } from './ai';
import { retrieveUnstagedChanges } from './git';

const changes = await retrieveUnstagedChanges();
const msg = await gitAi(changes);

console.log(msg);
