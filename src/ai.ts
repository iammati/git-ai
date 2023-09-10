import OpenAI from 'openai';
import { OPENAI_API_KEY } from './environment';

const intro = `Create a summary of the diff below the template, and explain what changes and why depending only on the actual diff. Use the following format of conventional-commits to summarize it:
"<type>(optional scope): <Short description, up to 80 chars>
\n
<descriptional text> - Be specific but not too detail-rich - be descriptive.
Use the imperative, present tense: "change" not "changed" nor "changes".
Don't capitalize first letter of the description.
No dot (.) at the end."

Please wrap every line inside the template to a max. of 80 characters. Wrap is mandatory!`;

export const gitAi = async (diff: string) => {
    const openai = new OpenAI({
        apiKey: OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
        messages: [{ role: 'system', content: intro + '\n\n' + diff, }],
        model: 'gpt-3.5-turbo',
    });

    const msg = completion.choices[0].message.content + '\n\n';
    return msg;
};
