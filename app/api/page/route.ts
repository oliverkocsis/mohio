import { NextResponse } from "next/server";

// Mock wiki content (can be replaced with a database in the future)
let wikiContent = "This is an example wiki page content.";
let instructions = "Make all letters capital.";

// GET handler for fetching the wiki content
export async function GET() {
    return NextResponse.json({ content: wikiContent, instructions: instructions });
}