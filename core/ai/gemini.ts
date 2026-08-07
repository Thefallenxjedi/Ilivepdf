export type ChatMessage = {
  role: "user" | "model";
  text: string;
};

type GeminiPart = { text: string };

type GeminiContent = {
  role: "user" | "model";
  parts: GeminiPart[];
};

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  error?: { message?: string };
};

const MODEL = "gemini-2.5-flash-lite";

async function callGemini(apiKey: string, contents: GeminiContent[], systemInstruction?: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 4096,
    },
  };

  if (systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as GeminiResponse;

  if (!response.ok) {
    throw new Error(data.error?.message || `Gemini request failed (${response.status})`);
  }

  const text = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("Gemini returned an empty response. Try again with a shorter document.");
  }

  return text;
}

function buildDocumentContext(docs: Array<{ name: string; text: string }>) {
  return docs
    .map(
      (doc, index) =>
        `--- Document ${index + 1}: ${doc.name} ---\n${doc.text || "(No extractable text found in this PDF.)"}`,
    )
    .join("\n\n");
}

export async function chatWithDocuments(
  apiKey: string,
  docs: Array<{ name: string; text: string }>,
  history: ChatMessage[],
  question: string,
) {
  const systemInstruction = `You are iLivePDF's document assistant. Answer using only the provided PDF content. If the answer is not in the documents, say so clearly. Be concise and practical. Cite document names when helpful.`;

  const context = buildDocumentContext(docs);
  const contents: GeminiContent[] = [
    {
      role: "user",
      parts: [
        {
          text: `Here are the uploaded PDF documents:\n\n${context}\n\nUse these documents for the rest of this conversation.`,
        },
      ],
    },
    {
      role: "model",
      parts: [
        {
          text: "I have read the uploaded documents and I am ready to answer questions about them.",
        },
      ],
    },
  ];

  for (const message of history) {
    contents.push({
      role: message.role,
      parts: [{ text: message.text }],
    });
  }

  contents.push({
    role: "user",
    parts: [{ text: question }],
  });

  return callGemini(apiKey, contents, systemInstruction);
}

export async function summarizeDocuments(
  apiKey: string,
  docs: Array<{ name: string; text: string }>,
  style: "brief" | "detailed" | "bullets",
) {
  const styleHint =
    style === "brief"
      ? "Write a short paragraph summary (about 5-8 sentences)."
      : style === "bullets"
        ? "Write a clear bullet-point summary with the key points."
        : "Write a detailed but readable summary covering main sections and takeaways.";

  const systemInstruction = `You are iLivePDF's document summarizer. ${styleHint} Use only the provided PDF content. If text is missing, say what could not be summarized.`;

  const context = buildDocumentContext(docs);

  return callGemini(
    apiKey,
    [
      {
        role: "user",
        parts: [
          {
            text: `Summarize the following PDF document(s):\n\n${context}`,
          },
        ],
      },
    ],
    systemInstruction,
  );
}
