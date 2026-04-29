/**
 * Renderiza un WebContent (markdown o html) con fallback.
 * Uso: <WebContentBlock contentKey="about.nosotros" fallbackTitle="Nosotros" fallbackContent="..." />
 */
import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { getContent } from "@/components/cms/cmsHelpers";

export default function WebContentBlock({ contentKey, fallbackTitle = "", fallbackContent = "", className = "" }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    getContent(contentKey, fallbackTitle, fallbackContent).then(setData);
  }, [contentKey]);

  if (!data) return null;

  return (
    <div className={className}>
      {data.title && (
        <h2 className="text-2xl md:text-3xl font-bold text-[#003366] mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
          {data.title}
        </h2>
      )}
      {data.image_url && (
        <img src={data.image_url} alt={data.title || ""} className="w-full rounded-2xl mb-6 object-cover max-h-72" />
      )}
      {data.content_format === "html" ? (
        <div
          className="prose prose-blue max-w-none text-gray-700"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(data.content || "") }}
        />
      ) : (
        <div className="prose prose-blue max-w-none text-gray-700">
          <ReactMarkdown>{data.content || fallbackContent}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

/** Sanitize básico: elimina <script> tags */
function sanitizeHtml(html) {
  return html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
}