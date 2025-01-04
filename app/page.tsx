"use client";

import { useState, useEffect } from "react";

export default function App() {
  const [content, setContent] = useState("");
  const [instructions, setInstructions] = useState("");
  const [updatedContent, setUpdatedContent] = useState("");

  useEffect(() => {
    async function fetchContent() {
      const res = await fetch("/api/page");
      const data = await res.json();
      setContent(data.content);
    }
    fetchContent();
  }, []);

  const handleEdit = async () => {
    const res = await fetch("/api/edit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, instructions }),
    });
    const data = await res.json();
    setUpdatedContent(data.updatedContent);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Wiki Editor</h1>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Original Content</h2>
          <textarea
            className="w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring focus:ring-blue-300 focus:outline-none"
            value={content}
            readOnly
            rows={8}
          />
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Editing Instructions</h2>
          <textarea
            className="w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring focus:ring-blue-300 focus:outline-none"
            placeholder="Enter your editing instructions here"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={5}
          />
          <button
            onClick={handleEdit}
            className="mt-4 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-300"
          >
            Submit Edits
          </button>
        </div>

        {updatedContent && (
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Updated Content</h2>
            <textarea
              className="w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring focus:ring-blue-300 focus:outline-none"
              value={updatedContent}
              readOnly
              rows={8}
            />
          </div>
        )}
      </div>
    </div>
  );
}
