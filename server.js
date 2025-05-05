import 'dotenv/config';
import express from "express";
import OpenAI from "openai";
import fetch from "node-fetch";

const app = express().use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const appId = process.env.TALKJS_APP_ID;
const talkJSSecretKey = process.env.TALKJS_SECRET_KEY;
const basePath = "https://api.talkjs.com";
const botId = "chatbotExampleBot";
const allMessageHistory = {};

app.post("/onMessageSent", async (req, res) => {
  console.log("Webhook received:", JSON.stringify(req.body, null, 2));
  const convId = req.body.data.conversation.id;
  const messageText = req.body.data.message.text;
  const senderId = req.body.data.sender.id;

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
      console.log("OpenAI reply:", reply);
      // Add bot reply to history
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
      console.log("TalkJS API response status:", talkjsRes.status);
      const talkjsResText = await talkjsRes.text();
      console.log("TalkJS API response body:", talkjsResText);
    } catch (err) {
      console.error("Error in OpenAI or TalkJS API:", err);
    }
  }

  res.status(200).end();
});

app.listen(3000, () => console.log("Server is up on port 3000")); 