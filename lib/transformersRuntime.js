import { env, pipeline } from '@huggingface/transformers';

env.allowRemoteModels = true;
env.allowLocalModels = false;

export const TRANSFORMERS_DEFAULT_MODEL =
  process.env.NEXT_PUBLIC_TRANSFORMERS_MODEL || 'onnx-community/gemma-4-E2B-it-ONNX';

export const TRANSFORMERS_MODEL_OPTIONS = [
  {
    id: 'onnx-community/gemma-3-1b-it-ONNX-GQA',
    label: 'Gemma 3 1B (Text)',
    dtype: 'q4f16',
  },
  {
    id: 'onnx-community/gemma-4-E2B-it-ONNX',
    label: 'Gemma 4 E2B (Multimodal family)',
    dtype: 'q4f16',
  },
  {
    id: 'onnx-community/gemma-4-E4B-it-ONNX',
    label: 'Gemma 4 E4B (Highest quality)',
    dtype: 'q4f16',
  },
];

const generatorCache = new Map();

function buildPrompt(messages) {
  const normalized = messages.map((m) => {
    const role = m.role === 'assistant' ? 'Assistant' : m.role === 'system' ? 'System' : 'User';
    return `${role}: ${m.content}`;
  });

  return `${normalized.join('\n\n')}\n\nAssistant:`;
}

function resolveDtype(modelId) {
  return (
    TRANSFORMERS_MODEL_OPTIONS.find((m) => m.id === modelId)?.dtype ||
    process.env.NEXT_PUBLIC_TRANSFORMERS_DTYPE ||
    'q4f16'
  );
}

export async function warmupTransformers(modelId, onProgress) {
  const chosenModel = modelId || TRANSFORMERS_DEFAULT_MODEL;
  const cacheKey = `${chosenModel}::${resolveDtype(chosenModel)}`;

  if (!generatorCache.has(cacheKey)) {
    const generatorPromise = pipeline('text-generation', chosenModel, {
      device: 'webgpu',
      dtype: resolveDtype(chosenModel),
      progress_callback: (report) => onProgress?.(report),
    }).catch((error) => {
      generatorCache.delete(cacheKey);
      throw error;
    });

    generatorCache.set(cacheKey, generatorPromise);
  }

  return generatorCache.get(cacheKey);
}

export async function generateTransformersCompletion({
  modelId,
  messages,
  max_new_tokens = 220,
  temperature = 0.7,
  top_p = 0.95,
}) {
  const chosenModel = modelId || TRANSFORMERS_DEFAULT_MODEL;
  const generator = await warmupTransformers(chosenModel);
  const prompt = buildPrompt(messages);

  const output = await generator(prompt, {
    max_new_tokens,
    do_sample: true,
    temperature,
    top_p,
    return_full_text: false,
  });

  const text = output?.[0]?.generated_text || '';
  return String(text).trim();
}