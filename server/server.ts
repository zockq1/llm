import cors from "cors";
import express, { Request, Response } from "express";

const app = express();
const port = 9090;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json());

app.post("/chat", (req: Request, res: Response) => {
  const { messages, model } = req.body;

  // 서버가 받는 메시지 형식 검증
  if (!messages || messages.length !== 1 || model !== "ellm") {
    return res.status(400).json({ error: "Invalid request format" });
  }

  // 클라이언트로 보낼 예시 응답 텍스트
  const responseText =
    "LLM(Large Language Model)은 방대한 양의 텍스트 데이터를 학습하여 언어를 이해하고 생성할 수 있는 인공지능 모델을 말합니다.\\n\\n 이 모델들은 수십억 개 이상의 매개변수로 구성되어, 사람의 언어 패턴을 학습하고 예측하는 데 탁월한 성능을 보입니다.\\n\\n LLM은 일반적으로 Transformer 구조를 기반으로 하며, 그중 GPT(Generative Pre-trained Transformer)와 BERT(Bidirectional Encoder Representations from Transformers) 같은 모델들이 대표적입니다.\\n\\n" +
    "LLM(Large Language Model)은 방대한 양의 텍스트 데이터를 학습하여 언어를 이해하고 생성할 수 있는 인공지능 모델을 말합니다.\\n\\n 이 모델들은 수십억 개 이상의 매개변수로 구성되어, 사람의 언어 패턴을 학습하고 예측하는 데 탁월한 성능을 보입니다.\\n\\n LLM은 일반적으로 Transformer 구조를 기반으로 하며, 그중 GPT(Generative Pre-trained Transformer)와 BERT(Bidirectional Encoder Representations from Transformers) 같은 모델들이 대표적입니다.\\n\\n";

  const responseChunks = responseText.match(/.{1,10}/g) || []; // 응답을 10글자 단위로 분할

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let count = 0;

  const intervalId = setInterval(() => {
    if (count < responseChunks.length) {
      // 줄바꿈 포함한 부분 응답을 스트리밍
      const response = {
        model: "ellm",
        id: "d114e13e50274069885f070cf48f3983",
        choices: [
          {
            index: 0,
            finish_reason: null,
            message: {
              content: responseChunks[count],
              role: "assistant",
            },
          },
        ],
        created: Date.now(),
        object: "chat.completion",
      };
      res.write(`data: ${JSON.stringify(response)}\n\n`);
      count++;
    } else {
      // 마지막 응답에 finish_reason 포함하여 전송 후 종료
      const finalResponse = {
        model: "ellm",
        id: "d114e13e50274069885f070cf48f3983",
        choices: [
          {
            index: 0,
            finish_reason: "stop",
            message: {
              content: "",
              role: "assistant",
            },
          },
        ],
        created: Date.now(),
        object: "chat.completion",
      };
      res.write(`data: ${JSON.stringify(finalResponse)}\n\n`);
      clearInterval(intervalId);
      res.end();
    }
  }, 100); // 0.5초마다 응답 전송
});

app.listen(port, () => console.log(`Mock server is running on port: ${port}`));
