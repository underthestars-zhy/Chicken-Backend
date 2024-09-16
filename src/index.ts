import { Elysia, t } from "elysia";
import OpenAI from "openai";

const client = new OpenAI({
    apiKey: "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", // This is the default and can be omitted
});

const app = new Elysia()
    .get("/", () => ({status: 200}))
    .post('/translator/text/v3.0/translate', async ({query, headers, body}) => {
        console.log(query)
        console.log(headers)
        console.log(body)
        return 'a'
    }, {
        query: t.Object({
            to: t.String()
        }),
        headers: t.Object({
            "Ocp-Apim-Subscription-Key": t.String(),
            "Ocp-Apim-Subscription-Region": t.String()
        }),
        body: t.Object({
            Text: t.String()
        })
    })
    .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
