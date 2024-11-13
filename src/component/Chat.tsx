import React, { useState, useEffect, useRef } from "react";
import "./Chat.css"; // 스타일을 별도 CSS 파일로 분리

interface Message {
  id: number;
  text: string[];
  role: "user" | "assistant";
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [currentResponse, setCurrentResponse] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  // messages나 currentResponse가 변경될 때 자동으로 맨 아래로 스크롤
  useEffect(() => {
    if (isAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, currentResponse, isAutoScroll]);

  const handleWheel = () => {
    // 마우스 휠을 조작했을 때 자동 스크롤 비활성화
    setIsAutoScroll(false);

    if (chatContainerRef.current) {
      // 스크롤 위치 계산
      const { scrollTop, scrollHeight, clientHeight } =
        chatContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight <= 50;

      // 스크롤이 최하단 50px 이내일 경우 자동 스크롤 활성화
      if (isNearBottom) {
        setIsAutoScroll(true);
      }
    }
  };

  // 메시지 전송 함수
  const sendMessage = async () => {
    setCurrentResponse([]); // 실시간 응답 초기화

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
      let tempResponse = ""; // 응답을 수집할 임시 변수

      // 서버로부터 스트리밍된 데이터를 읽어와 처리
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
            // 응답을 문단 기준으로 배열로 저장 (문단 단위로 div 요소에 들어감)
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
            // 응답을 문단 기준으로 배열로 저장 (문단 단위로 div 요소에 들어감)
            setCurrentResponse(tempResponse.split("\\n\\n"));
          }
        });
      }
    }
  };

  // 사용자 메시지 제출 함수
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      // 사용자가 입력한 메시지를 messages에 추가
      setMessages((prev) => [
        ...prev,
        { id: messages.length + 1, text: [`You: ${input}`], role: "user" },
      ]);
      sendMessage();
      setInput("");
    }
  };

  return (
    <div className="chat-container">
      <h2 className="chat-title">ChatBot</h2>
      <div
        ref={chatContainerRef}
        onWheel={handleWheel}
        className="chat-messages"
      >
        {messages.map((msg, i) => (
          <div
            key={`m-${i}`}
            className={`chat-message ${
              msg.role === "user" ? "chat-user" : "chat-assistant"
            }`}
          >
            {msg.text.map((paragraph, index) => (
              // 문단 단위로 렌더링
              <div key={`${i}-${index}`} className="chat-paragraph">
                {paragraph.trim()}
              </div>
            ))}
          </div>
        ))}
        {currentResponse.length > 0 && (
          <div className="chat-assistant">
            {currentResponse.map((paragraph, index) => (
              // 문단 단위로 렌더링
              <div key={`c-${index}`} className="chat-paragraph">
                {paragraph.trim()}
              </div>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="chat-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="chat-input"
          placeholder="Type a message..."
        />
        <button type="submit" className="chat-send">
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat;
