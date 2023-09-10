const simpleGit = require('simple-git')();
const pc = require('picocolors');
const dotenv = require('dotenv');
const OpenAI = require('openai');
const fs = require('fs');

// .env stuff
const { NODE_ENV } = process.env;
dotenv.config({ path: `.env${NODE_ENV ? '.' + NODE_ENV : ''}` });
const { OPENAI_API_KEY } = process.env;

// Logging
const prefix = '[ git-ai ]';
const log = (...msg) => console.log(`${pc.yellow(prefix)} ${msg.join('\n' + prefix + ' ')}`);
const error = (...msg) => console.error(`${pc.red(prefix)} ${pc.red(msg.join('\n' + prefix + ' '))}`);

// Validating key
if ((OPENAI_API_KEY ?? '').length === 0) {
    return error('`OPENAI_API_KEY` environment variable is not set');
}

const ignoredFiles = [
    'pnpm-lock.yaml',
    'yarn.lock',
    'package-lock.json',
    'composer.lock',
];

// Actual magic
(async () => {
    const statusSummary = await simpleGit.status();
    const { staged } = statusSummary;

    if (staged.length === 0) {
        return error(
            `repository's staged-area looks empty. No files to make a summary of.`,
            `Use \`git add <file>\` to stage files.`,
        );
    }

    const stagedFiles = statusSummary.files.filter(file => {
        const { path: filePath } = file;

        // We don't care about lock-files
        if (ignoredFiles.some(extension => filePath.endsWith(extension))) {
            return false;
        }

        return !file.binary && !ignoredFiles.some(extension => filePath.endsWith(extension));
    });

    if (stagedFiles.length === 0) {
        return error('No files to commit');
    }

    log(`Committing ${stagedFiles.length} files...`);

    let gptMsg = '';

    // Loop through each file and get the diff content
    for (const file of stagedFiles) {
        const { path: filePath } = file;

        let diff = await simpleGit.diff([filePath]);
        let diffMsg = `Diff content for file: ${filePath}:\n\n${diff}\n`;

        if (diff.length === 0) {
            diff = fs.readFileSync(filePath, 'utf-8');
            diffMsg = `New file: ${filePath} with content:\n\n${diff}\n`;
        }

        gptMsg += diffMsg;
    }

    const intro = `Create a summary from the diff and explain what changes and why. Use the following format of conventional-commits:
"<type>(optional scope): <Short description, up to 80 chars>
\n
<descriptional text> - Wrap it to max. 80 chars per line. Be specific but not too detail-rich. Be descriptive.
Use the imperative, present tense: "change" not "changed" nor "changes".
Don't capitalize first letter of the description.
No dot (.) at the end."`;
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
