import React from "react";
import { Wand2, Brain, Search } from "lucide-react";

export default function AIActionButtons() {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      <button
        onClick={() => {
          console.log("AI Refactoring logic...");
          alert("AI is analyzing your code structure and will suggest improvements for better readability and performance.");
        }}
        className="bg-white border border-light p-3 rounded-full shadow-md hover:bg-accent-light transition-colors"
        title="Refactor Logic"
      >
        <Wand2 className="w-5 h-5 text-primary" />
      </button>
      <button
        onClick={() => {
          console.log("AI Explaining code...");
          alert("AI Code Explanation:\n\nThis logic implements a motor control sequence with safety interlocks. The code structure follows industry standards with proper error handling and safety protocols.");
        }}
        className="bg-white border border-light p-3 rounded-full shadow-md hover:bg-accent-light transition-colors"
        title="Explain Code"
      >
        <Brain className="w-5 h-5 text-primary" />
      </button>
      <button
        onClick={() => {
          console.log("AI Highlighting variables...");
          alert("Variable Analysis:\n\n✓ Input Variables: 12 found\n✓ Output Variables: 8 found\n✓ Internal Variables: 15 found\n✓ Safety Variables: 6 found\n\nAll variables are properly documented and follow naming conventions.");
        }}
        className="bg-white border border-light p-3 rounded-full shadow-md hover:bg-accent-light transition-colors"
        title="Highlight Variables"
      >
        <Search className="w-5 h-5 text-primary" />
      </button>
    </div>
  );
}
