import { Elysia, t } from "elysia";
import OpenAI from "openai";
import {Logestic} from "logestic";

const client = new OpenAI({
    apiKey: process.env.OPENAI_KEY, // This is the default and can be omitted
});

async function getHskVocabulary(level: number): Promise<string[]> {
    const vocabulary: string[] = [];

    for (let i = 1; i <= level; i++) {
        try {
            const filePath = `public/HSK ${level}.txt`
            const fileContent = await Bun.file(filePath).text()
            vocabulary.push(...fileContent.split('\n').map(line => line.trim()));
        } catch (error) {
            if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
                console.warn(`Warning: HSK ${i}.txt not found`);
            } else {
                throw error;
            }
        }
    }

    return vocabulary;
}

const text_example = {
    [1]: `
    - 她很高兴。
    - 太好了！
    - 我住在北京。
    - 我会做饭。
    `,
    [2]: `
    - 你别去游泳了。
    - 他们一起去机场了。
    - 因为下雨，所以他没去踢足球。
    - 学校离我家很近。
    `,
    [3]: `
    - 这儿的西瓜特别甜。
    - 中国的大城市，我几乎都去过。
    - 请安静，节目马上开始。
    - 这道题其实很容易。
    `,
    [4]: `
    - 关于这个问题，后面我还会详细说。
    - 把这个字去掉，这个句子就对了。
    - 女儿给我的生活带来很多快乐。
    - 妈妈把刚买的鱼放进了冰箱。
    `,
    [5]: `
    - 因为马上就要开始上课了，所以快进教室。
    - 他和朋友吵了，所以很不高兴。
    - 我和我妻子有共同的理想和生活目标。
    - 常用的交通工具有汽车、火车、飞机等。
    `,
    [6]: `
    - 照片要三天才能洗出来。
    - 各位乘客，飞机马上就要起飞了。
    - 妹妹的嘴边有一粒米。
    - 这种植物我们都没见过。
    `
}

async function translate(text: string, level: 1 | 2 | 3 | 4 | 5 | 6): Promise<string> {
    const hsk_vocabulary = await getHskVocabulary(level)
    const hsk_vocab_str = hsk_vocabulary.join(', ')

    let chatCompletion = await client.chat.completions.create({
        messages: [
            {
                role: "system",
                content: `You are a professional Chinese translator. Your task is to simplify Chinese sentences or translate and simplify English sentences into Chinese. You will be given the learner's fluency level in their second language, when you translate the content, keep first language words that user likely would not know in their second language, given their fluency level.
                    
                    Here is an example of an English Sentence in different language fluency levels. 
                    Original English text: The study of abiogenesis aims to determine how pre-life chemical reactions gave rise to life under conditions strikingly different from those on Earth today. 
                    HSK level adjusted output: 
                
                    HSK7:  生命起源的研究旨在确定在与当今地球截然不同的条件下，非生命的化学反应如何产生了生命。

                    HSK6: 生命来源的研究学习在与现在的地球环境不同的条件下，非生命的化学反应如何生成了生命。

                    HSK5: 生命 originate 的研究想要知道，在和现在不同的地球条件下，非生命的化学反应是怎么变成生命的。

                    HSK4: The study of 研究生命如何开始，想了解在不同环境下，化学反应是怎么产生生命的。

                    HSK3: Scientists学习生命是怎么开始的，他们想知道在不同条件下，化学reaction如何变成生命。

                    HSK2: 人们想知道life是怎么来的，他们想知道chemistry reaction 怎样变成life。

                    HSK1: 人想知道life是怎么来的。
                    `
            },
            {
                role: 'user',
                content: `
                    fluency level: ${level}
                    Here are the HSK vocabulary list for the fluency level:
                    ${hsk_vocab_str}
                    
                    --- CONTENT START
                    
                    ${text}
                    
                    --- CONTENT END
                    
                    Understand the provided content above. Retell them with the same meaning using Chinese Words from the Chinese HSK ${level} vocabulary set provided above, and maintaining the first language words that users would likely not know in their second language based on their fluency level. You can break one sentence into multiple ones composed of Chinese HSK ${level} vocabulary and user's first language words. Your output should be in Chinese words that are in the provided dictionary and other words that remain in English.
                    
                    The attached dictionary is only a guide - you should consider the Fluency Level of the user and be intelligent about not showing them words in their second language that they don't know. Keep the Chinese characters within their HSK level.
                    
                    **The response should only contains the paraphrased text.**
                    **If the provided content is empty or represent nothing, just response with nothing.**
                    **The response should not contains the indicator like "--- CONTENT START".**
                    
                    DON'T PUT SUPER COMPLICATED WORDS. IF SOMEONE IS HSK3, DON'T SHOW HSK7 WORDS. ALSO KEEP THE GRAMMAR SIMPLE! DO NOT ADD UNNECESSARY COMPLICATED GRAMMARS IN CHINESE.
                    `
            }
        ],
        model: 'gpt-4o-mini'
    })

    return chatCompletion.choices[0].message.content ?? ""
}

const app = new Elysia()
    .use(Logestic.preset('common'))
    .get("/", () => ({status: 200}))
    .post('/translate', async ({query, headers, body}) => {
        return await Promise.all(body.map(async req => ({
            detectedLanguage: {
                language: query.from ?? 'en',
                score: 1
            },
            translations: [
                {
                    text: await translate(req.text, headers["ocp-apim-subscription-region"] as unknown as 1 | 2 | 3 | 4 | 5 | 6),
                    to: query.to
                }
            ]
        })))
    }, {
        query: t.Object({
            to: t.String(),
            from: t.Optional(t.String()),
            "api-version": t.String()
        }),
        headers: t.Object({
            "ocp-apim-subscription-region": t.String(),
            "ocp-apim-subscription-key": t.String()
        }),
        body: t.Array(t.Object({
            text: t.String()
        }))
    })
    .listen(process.env.PORT || 5432);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
