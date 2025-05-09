import OpenAI from "openai";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({ apiKey: "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" });

async function main() {
  // 1. Upload the file for file_search
  const file = await openai.files.create({
    file: fs.createReadStream("loanData.md"),
    purpose: "assistants"
  });
  console.log("File uploaded:", file.id);

  // 2. Create the assistant (use file_search tool)
  const assistant = await openai.beta.assistants.create({
    name: "Loan Assistant",
    instructions: "You are a helpful loan assistant. Use the uploaded file to answer questions.",
    tools: [{ type: "file_search" }],
    model: "gpt-4o"
  });
  console.log("Assistant created:", assistant.id);
}

main().catch(console.error); 