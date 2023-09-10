const simpleGit = require('simple-git')();
const pc = require('picocolors');
const dotenv = require('dotenv');
const OpenAI = require('openai');

// .env stuff
const { NODE_ENV } = process.env;
dotenv.config({ path: `.env${NODE_ENV ? '.' + NODE_ENV : ''}` });
const { OPENAI_API_KEY } = process.env;

// Logging
const prefix = '[ git-ai ]';

const log = msg => {
    console.log(`${pc.yellow(prefix)} ${msg}`);
};

const error = msg => {
    console.log(`${pc.red(prefix)} ${pc.red(msg)}`);
};

// Validating key
if ((OPENAI_API_KEY ?? '').length === 0) {
    return error('`OPENAI_API_KEY` environment variable is not set');
}

// Actual magic
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

    const intro = `Summarize my changes I'll provide you with. Use the following format of conventional-commits:
"<type>(optional scope): <Short description, up to 80 chars>
\n
Longer body/description. Hard-Wrap it to max. 80 chars per line. Be specific but not too detail-rich. Be descriptive.
Use the imperative, present tense: "change" not "changed" nor "changes".
Don't capitalize first letter of the description.
No dot (.) at the end.

"

Flush the diff from your response. I do not want to see it.`;
    const content = intro + '\n\n' + gptMsg;

    const openai = new OpenAI({
        apiKey: OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: content, }],
        model: 'gpt-3.5-turbo',
    });

    const msg = completion.choices[0].message.content + '\n\n';
    console.log(msg);
})();
