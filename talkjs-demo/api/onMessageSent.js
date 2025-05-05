import OpenAI from "openai";
import fetch from "node-fetch";

const openai = new OpenAI({ apiKey: process.env.OPENAI_SECRET_KEY });

const appId = process.env.TALKJS_APP_ID;
const talkJSSecretKey = process.env.TALKJS_SECRET_KEY;
const basePath = "https://api.talkjs.com";
const botId = "chatbotExampleBot";
const allMessageHistory = {};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { conversation, message, sender } = req.body.data;
  const convId = conversation.id;
  const messageText = message.text;
  const senderId = sender.id;

  if (!(convId in allMessageHistory)) {
    allMessageHistory[convId] = [
      {
        role: "system",
        content: "You are a helpful loan assistant for NFTYDoor. NftyDoor is a digital heloc lender. Please provide short, concise answers about heloc loans and the application process.",
      },
    ];
  }
  const messageHistory = allMessageHistory[convId];

  if (senderId == botId) {
    // Bot message
    messageHistory.push({ role: "assistant", content: messageText });
  } else {
    // User message
    messageHistory.push({ role: "user", content: messageText });
    try {
      const completion = await openai.chat.completions.create({
        messages: messageHistory,
        model: "gpt-4o",
      });
      const reply = completion.choices[0].message.content;
      messageHistory.push({ role: "assistant", content: reply });

      // Send bot reply to TalkJS
      const talkjsRes = await fetch(
        `${basePath}/v1/${appId}/conversations/${convId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${talkJSSecretKey}`,
          },
          body: JSON.stringify([
            {
              text: reply,
              sender: botId,
              type: "UserMessage",
            },
          ]),
        }
      );
      // Optionally log response for debugging
      // const talkjsResText = await talkjsRes.text();
      // console.log("TalkJS API response:", talkjsRes.status, talkjsResText);
    } catch (err) {
      console.error("Error in OpenAI or TalkJS API:", err);
    }
  }

  res.status(200).end();
} 