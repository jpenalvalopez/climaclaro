import React, { useState } from "react";
import AdminWebTexts from "./AdminWebTexts";
import AdminWebContent from "./AdminWebContent";
import { Type, FileText } from "lucide-react";

const TABS = [
  { key: "texts", label: "Textos cortos (UI)", icon: Type },
  { key: "content", label: "Textos largos (Páginas)", icon: FileText },
];

export default function AdminCmsContent() {
  const [tab, setTab] = useState("texts");

  return (
    <div>
      <div className="flex gap-2 mb-6 border-b">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === key ? "border-[#00509E] text-[#00509E]" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>
      {tab === "texts" && <AdminWebTexts />}
      {tab === "content" && <AdminWebContent />}
    </div>
  );
}