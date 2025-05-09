import OpenAI from "openai";
import fetch from "node-fetch";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const FILE_ID = process.env.FILE_ID; // Set in Vercel env if needed
const assistantId = process.env.ASSISTANT_ID;
const appId = process.env.TALKJS_APP_ID;
const talkJSSecretKey = process.env.TALKJS_SECRET_KEY;
const basePath = "https://api.talkjs.com";
const botId = "chatbotExampleBot";
const threadMap = {};

// Deduplication set to prevent processing the same message multiple times
const processedMessages = new Set(); // For production, use a persistent store or cache with expiry

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const convId = req.body.data.conversation.id;
  const messageText = req.body.data.message.text;
  const senderId = req.body.data.sender.id;
  const messageId = req.body.data.message.id;
  if (processedMessages.has(messageId)) {
    console.log("Duplicate message detected, skipping:", messageId);
    return res.status(200).end();
  }
  processedMessages.add(messageId);
  console.log("senderId:", senderId, "botId:", botId);
  console.log("Message ID:", messageId, "Text:", messageText);

  if (senderId == botId) {
    return res.status(200).end(); // Ignore bot's own messages
  }

  // 1. Get or create thread for this conversation
  let threadId = threadMap[convId];
  if (!threadId) {
    const thread = await openai.beta.threads.create();
    threadId = thread.id;
    threadMap[convId] = threadId;
    console.log("threadId:", threadId, typeof threadId); // Confirm it's a string
  }

  console.log("Using threadId for API call:", threadId, typeof threadId, JSON.stringify(threadId));

  // 2. Send user message to assistant thread
  await openai.beta.threads.messages.create(threadId, {
    role: "user",
    content: messageText
  });

  // 3. Run the assistant
  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: assistantId,
    instructions: "You are a helpful assistant for NFTYDoor. Here is some context: [NFTYDoor is a Heloc lender, and provide digital helocs in a little as a few days.].  When looking for context from the documents that you were provided. VERY IMPORTANT: Do not include file names, citations, or source references in your answers. Answer as if you know the information directly. Also, always respond as a member of the NftyDoor team. Do not refer to NftyDoor in the third person using 'they' or 'them.' Instead, use 'we,' 'our,' and 'us' to represent the company. For example, say 'We use secure authentication...' instead of 'They use...' This helps establish trust and creates a more direct, personal tone with the borrower."
    // Optionally include file search resources
    // tool_resources: { file_search: { file_ids: [FILE_ID] } }
  });

  console.log("run object:", run);
  console.log("run.id:", run.id, typeof run.id);
  console.log("run keys:", Object.keys(run));

  // 4. Poll for completion
  let runStatus;
  do {
    await new Promise(r => setTimeout(r, 1500));
    const runIdToUse = run.id?.id || run.data?.id || run.id;
    console.log("Using runId for retrieve:", runIdToUse, typeof runIdToUse);
    runStatus = await openai.beta.threads.runs.retrieve(threadId, runIdToUse);
  } while (runStatus.status !== "completed" && runStatus.status !== "failed");

  // 5. Get the latest assistant message
  const messages = await openai.beta.threads.messages.list(threadId);
  console.log("All messages:", JSON.stringify(messages, null, 2));
  const assistantMsg = messages.data.find(m => m.role === "assistant" && m.run_id === run.id);
  console.log("assistantMsg:", assistantMsg);
  if (assistantMsg) {
    console.log("assistantMsg.content:", assistantMsg.content);
    const rawText = assistantMsg.content[0].text.value;
    const cleanText = rawText.replace(/【.*?†source】/g, "");
    const response = await fetch(
      `${basePath}/v1/${appId}/conversations/${convId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${talkJSSecretKey}`,
        },
        body: JSON.stringify([
          {
            text: cleanText,
            sender: botId,
            type: "UserMessage",
          },
        ]),
      }
    );
    const responseBody = await response.text();
    console.log("TalkJS response status:", response.status);
    console.log("TalkJS response body:", responseBody);
  }

  res.status(200).end();
} 