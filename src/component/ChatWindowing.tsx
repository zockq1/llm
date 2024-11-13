import React, { useState } from "react";
import { Virtuoso } from "react-virtuoso";

interface Message {
  id: number;
  text: string[];
  role: "user" | "assistant";
}

const ChatWindowing: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [currentResponse, setCurrentResponse] = useState<string[]>([]);

  const sendMessage = async () => {
    setCurrentResponse([]);

    const response = await fetch("http://localhost:9090/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: input }],
        model: "ellm",
      }),
    });

    const reader = await response.body?.getReader();
    const decoder = new TextDecoder();

    if (reader) {
      let isConnected = true;
      let id = messages.length + 1;
      let tempResponse = ""; // 데이터 수집용 임시 변수

      while (isConnected) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const data = text
          .split("\n\n")
          .filter((line) => line.startsWith("data: "))
          .map((line) => line.slice(6).trim());

        data.forEach((message) => {
          const parsedMessage = JSON.parse(message);
          const assistantMessage = parsedMessage.choices[0].message.content;
          const finishReason = parsedMessage.choices[0].finish_reason;

          tempResponse += assistantMessage;

          if (finishReason === "stop") {
            const paragraphs = tempResponse.split("\\n\\n");
            setMessages((prevMessages) => [
              ...prevMessages,
              {
                id: id++,
                text: paragraphs,
                role: "assistant",
              },
            ]);
            setCurrentResponse([]);
            isConnected = false;
          } else {
            setCurrentResponse(tempResponse.split("\\n\\n")); // 실시간 응답 배열로 저장
          }
        });
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      setMessages((prev) => [
        ...prev,
        { id: messages.length + 1, text: [`You: ${input}`], role: "user" },
      ]);
      sendMessage();
      setInput("");
    }
  };

  return (
    <div
      style={{
        width: "500px",
        borderRadius: "8px",
        padding: "20px",
        backgroundColor: "#fff",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "20px", color: "#333" }}>
        ChatBot
      </h2>
      {/* 윈도우잉 적용 */}
      <Virtuoso
        style={{
          height: "400px",
          border: "1px solid #ddd",
          borderRadius: "8px",
        }}
        totalCount={messages.length + (currentResponse.length > 0 ? 1 : 0)}
        followOutput={"auto"}
        itemContent={(index) => {
          const msg =
            index < messages.length
              ? messages[index]
              : { id: 0, text: currentResponse, role: "assistant" };
          return msg.text.map((paragraph) => (
            <div key={paragraph} style={{ marginBottom: "10px" }}>
              {paragraph.trim()}
            </div>
          ));
        }}
      />
      <form onSubmit={handleSubmit} style={{ display: "flex" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: "4px",
            border: "1px solid #ddd",
          }}
          placeholder="Type a message..."
        />
        <button
          type="submit"
          style={{
            padding: "10px 20px",
            marginLeft: "10px",
            borderRadius: "4px",
            backgroundColor: "#007bff",
            color: "#fff",
            border: "none",
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatWindowing;
