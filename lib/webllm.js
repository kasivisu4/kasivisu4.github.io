import { CreateMLCEngine } from '@mlc-ai/web-llm';

export const WEBLLM_MODEL =
  process.env.NEXT_PUBLIC_WEBLLM_MODEL || 'Llama-3.2-1B-Instruct-q4f32_1-MLC';

let enginePromise = null;

export async function warmupWebLLM(onProgress) {
  if (!enginePromise) {
    enginePromise = CreateMLCEngine(WEBLLM_MODEL, {
      initProgressCallback: (report) => {
        onProgress?.(report);
      },
    }).catch((error) => {
      enginePromise = null;
      throw error;
    });
  }

  return enginePromise;
}

export async function streamChatCompletion({ messages, onChunk, temperature = 0.7, max_tokens = 220 }) {
  const engine = await warmupWebLLM();

  const stream = await engine.chat.completions.create({
    messages,
    stream: true,
    temperature,
    max_tokens,
  });

  let fullText = '';
  for await (const chunk of stream) {
    const delta = chunk?.choices?.[0]?.delta?.content ?? '';
    if (!delta) continue;
    fullText += delta;
    onChunk?.(fullText, delta);
  }

  return fullText.trim();
}