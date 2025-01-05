import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1/models';

const sendMessageToOpenAI = async (message, apiKey, settings) => {
  if (!apiKey) {
    throw new Error('OpenAI API key is required');
  }

  const isVisionModel = settings.selectedModel === 'gpt-4-vision-preview';
  const model = settings.selectedModel || 'gpt-3.5-turbo';

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  };

  let messages = [];
  
  if (settings.systemPrompt) {
    messages.push({
      role: 'system',
      content: settings.systemPrompt
    });
  }

  if (isVisionModel && settings.files?.length > 0) {
    const imageContents = await Promise.all(
      settings.files.map(async (file) => {
        const base64 = await getBase64(file);
        return {
          type: 'image_url',
          image_url: {
            url: `data:${file.type};base64,${base64}`
          }
        };
      })
    );

    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: message },
        ...imageContents
      ]
    });
  } else {
    messages.push({
      role: 'user',
      content: message
    });
  }

  try {
    console.log('Sending request to OpenAI:', { model, messages });
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model,
      messages,
      temperature: settings.temperature || 0.7,
      max_tokens: settings.maxTokens || 1000
    }, { headers });

    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenAI');
    }

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    if (error.response?.status === 429) {
      throw new Error('OpenAI API rate limit exceeded. Please wait a moment and try again.');
    } else if (error.response?.status === 401) {
      throw new Error('Invalid OpenAI API key. Please check your API key in settings.');
    }
    throw new Error(error.response?.data?.error?.message || 'Error calling OpenAI API');
  }
};

const sendMessageToGemini = async (message, apiKey, settings) => {
  if (!apiKey) {
    throw new Error('Google API key is required');
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: settings.selectedModel || 'gemini-pro' });

    console.log('Sending request to Gemini:', { model: settings.selectedModel, message });

    if (settings.selectedModel === 'gemini-pro-vision' && settings.files?.length > 0) {
      const imageContents = await Promise.all(
        settings.files.map(async (file) => {
          const base64 = await getBase64(file);
          return {
            inlineData: {
              data: base64,
              mimeType: file.type
            }
          };
        })
      );

      const result = await model.generateContent([message, ...imageContents]);
      const response = await result.response;
      return response.text();
    } else {
      const result = await model.generateContent(message);
      const response = await result.response;
      return response.text();
    }
  } catch (error) {
    console.error('Gemini API Error:', error);
    if (error.message?.includes('API key')) {
      throw new Error('Invalid Google API key. Please check your API key in settings.');
    }
    throw new Error(error.message || 'Error calling Gemini API');
  }
};

const sendMessageToOllama = async (message, settings) => {
  if (!settings.selectedModel) {
    throw new Error('Please select an Ollama model');
  }

  try {
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: settings.selectedModel,
        messages: [
          ...(settings.systemPrompt ? [{ role: 'system', content: settings.systemPrompt }] : []),
          { role: 'user', content: message }
        ],
        stream: false,
        options: {
          temperature: settings.temperature || 0.7
        }
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get response from Ollama');
    }

    const data = await response.json();
    if (!data.message?.content) {
      throw new Error('Invalid response from Ollama');
    }
    return data.message.content;
  } catch (error) {
    console.error('Ollama Error:', error);
    if (error.message.includes('Failed to fetch')) {
      throw new Error('Could not connect to Ollama. Please make sure it is running.');
    }
    throw error;
  }
};

const sendMessageToHuggingFace = async (message, apiKey, settings) => {
  if (!apiKey) {
    throw new Error('Hugging Face API key is required');
  }

  const model = settings.selectedModel || 'mistralai/Mixtral-8x7B-Instruct-v0.1';

  try {
    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: settings.systemPrompt 
          ? `${settings.systemPrompt}\n\nUser: ${message}\nAssistant:`
          : `User: ${message}\nAssistant:`,
        parameters: {
          temperature: settings.temperature || 0.7,
          max_new_tokens: settings.maxTokens || 1000,
          return_full_text: false
        }
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get response from Hugging Face');
    }

    const data = await response.json();
    if (!data.generated_text) {
      throw new Error('Invalid response from Hugging Face');
    }
    return data.generated_text;
  } catch (error) {
    console.error('Hugging Face API Error:', error);
    throw error;
  }
};

const sendMessageToDeepSeek = async (message, apiKey, settings) => {
  if (!apiKey) {
    throw new Error('DeepSeek API key is required');
  }

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: settings.selectedModel || 'deepseek-chat',
        messages: [
          ...(settings.systemPrompt ? [{ role: 'system', content: settings.systemPrompt }] : []),
          { role: 'user', content: message }
        ],
        temperature: settings.temperature || 0.7,
        max_tokens: settings.maxTokens || 1000
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get response from DeepSeek');
    }

    const data = await response.json();
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from DeepSeek');
    }
    return data.choices[0].message.content;
  } catch (error) {
    console.error('DeepSeek API Error:', error);
    throw error;
  }
};

const sendMessageToOpenRouter = async (message, apiKey, settings) => {
  if (!apiKey) {
    throw new Error('OpenRouter API key is required');
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Windsurf Chat'
      },
      body: JSON.stringify({
        model: settings.selectedModel || 'openai/gpt-3.5-turbo',
        messages: [
          ...(settings.systemPrompt ? [{ role: 'system', content: settings.systemPrompt }] : []),
          { role: 'user', content: message }
        ],
        temperature: settings.temperature || 0.7,
        max_tokens: settings.maxTokens || 1000
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get response from OpenRouter');
    }

    const data = await response.json();
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenRouter');
    }
    return data.choices[0].message.content;
  } catch (error) {
    console.error('OpenRouter API Error:', error);
    throw error;
  }
};

const getBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
};

export {
  sendMessageToOpenAI,
  sendMessageToGemini,
  sendMessageToOllama,
  sendMessageToHuggingFace,
  sendMessageToDeepSeek,
  sendMessageToOpenRouter
};
