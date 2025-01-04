import { NextResponse } from "next/server";
import OpenAI from "openai";

// Initialize OpenAI with API key
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

// Mock wiki content (shared with the page API)
let wikiContent = "This is an example wiki page content.";

// POST handler for editing the wiki content
export async function POST(req: Request) {
    try {
        const { content, instructions } = await req.json();

        if (!content || !instructions) {
            return NextResponse.json(
                { error: "Content and instructions are required." },
                { status: 400 }
            );
        }

        // Make a request to OpenAI's chat API
        const response = await openai.chat.completions.create({
            messages: [
                { role: "system", content: "You are an editor for a wiki site." },
                { role: "user", content: `Here is the wiki content:\n${content}` },
                { role: "user", content: `Instructions: ${instructions}` },
            ],
            model: "gpt-4", // Use the desired model
            max_tokens: 1000, // Adjust token limit as needed
        });

        // Extract the updated content from the response
        const updatedContent = response.choices[0]?.message?.content || "";

        // Update the mock content (you'd save this in a database in a real app)
        wikiContent = updatedContent;

        return NextResponse.json({ updatedContent });
    } catch (error) {
        console.error("Error editing content:", error);
        return NextResponse.json(
            { error: "Failed to process the edit request." },
            { status: 500 }
        );
    }
}
