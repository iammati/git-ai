const simpleGit = require('simple-git')();
const pc = require('picocolors');
const dotenv = require('dotenv');
const OpenAI = require('openai');

dotenv.config();
const { OPENAI_API_KEY } = process.env;

const prefix = '[ git-ai ]';

const log = msg => {
    console.log(`${pc.yellow(prefix)} ${msg}`);
};

const error = msg => {
    console.log(`${pc.red(prefix)} ${pc.red(msg)}`);
};

if ((OPENAI_API_KEY ?? '').length === 0) {
    return error('`OPENAI_API_KEY` environment variable is not set');
}

(async () => {
    const diffSummary = await simpleGit.diffSummary();

    const ignoredFiles = [
        'pnpm-lock.yaml',
        'yarn.lock',
        'package-lock.json',
        'composer.lock',
    ];

    const files = diffSummary.files.filter(file => {
        const { file: filePath } = file;
        return !file.binary && !ignoredFiles.some(extension => filePath.endsWith(extension));
    });

    if (files.length === 0) {
        return error('No files to commit');
    }

    log(`Committing ${files.length} files...`);

    let gptMsg = '';

    // Loop through each file and get the diff content
    for (const file of files) {
        const { file: filePath } = file;

        // We don't care about lock files
        if (ignoredFiles.some(extension => filePath.endsWith(extension))) {
            continue;
        }

        const diff = await simpleGit.diff([file.file]);
        gptMsg += `Diff content for file: ${filePath}:\n\n${diff}\n`;
    }

    const intro = `Take this as a template for the git diffs you are about to receive after the template:

"<type>(optional scope): <Short description, up to 80 chars>

Longer body/description, if necessary. Wrap it to 80 chars as well.
Use the imperative, present tense: "change" not "changed" nor "changes".
Don't capitalize first letter of the description.
No dot (.) at the end.

You may split descriptions with different meanings in-between with new-lines.
DO NOT PUT ACTUAL GIT DIFF CONTENT INTO THE GIT COMMIT MESSAGE, INSTEAD LIST CHANGES IN THE BODY.
DO NOT WRITE MULTIPLE <type>'s, DO NOT EXPLAIN WHY A COMMIT WAS MADE. THAT IS WHAT GIT DIFF IS FOR."`;
    const content = intro + '\n\n' + gptMsg;

    const openai = new OpenAI({
        apiKey: OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
        messages: [{ role: 'assistant', content: content, }],
        model: 'gpt-3.5-turbo',
    });

    console.log(completion.choices);
})();
