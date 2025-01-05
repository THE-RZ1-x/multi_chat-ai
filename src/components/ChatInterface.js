import React, { useState } from 'react';
import {
  Paper,
  TextField,
  IconButton,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Tooltip,
  form
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  sendMessageToGemini,
  sendMessageToDeepSeek,
  sendMessageToHuggingFace,
  sendMessageToOpenRouter,
  sendMessageToOpenAI,
  sendMessageToOllama
} from '../services/api';
import FileUpload from './FileUpload';

function ChatInterface({ settings = {}, apiKeys = {} }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState([]);

  const { selectedModel = '', selectedProvider = '' } = settings;
  const isVisionModel = selectedModel?.includes('vision');

  const handleFileSelect = (newFiles) => {
    setFiles(newFiles || []);
  };

  const handleFileRemove = () => {
    setFiles([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!input.trim() && (!isVisionModel || !files.length)) {
      setError('Please enter a message or upload an image for vision models');
      return;
    }

    if (!selectedProvider) {
      setError('Please select an AI provider in settings');
      return;
    }

    if (!selectedModel) {
      setError('Please select an AI model in settings');
      return;
    }

    if (!apiKeys[selectedProvider] && selectedProvider !== 'ollama') {
      setError(`Please enter an API key for ${selectedProvider} in settings`);
      return;
    }

    const userMessage = { role: 'user', content: input, files };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setFiles([]);
    setIsLoading(true);

    try {
      const messageSettings = {
        ...settings,
        files
      };

      let response;
      console.log(`Sending message to ${selectedProvider} with model ${selectedModel}`);
      
      switch (selectedProvider) {
        case 'google':
          response = await sendMessageToGemini(input, apiKeys.google, messageSettings);
          break;
        case 'openai':
          response = await sendMessageToOpenAI(input, apiKeys.openai, messageSettings);
          break;
        case 'huggingface':
          response = await sendMessageToHuggingFace(input, apiKeys.huggingface, messageSettings);
          break;
        case 'deepseek':
          response = await sendMessageToDeepSeek(input, apiKeys.deepseek, messageSettings);
          break;
        case 'ollama':
          response = await sendMessageToOllama(input, messageSettings);
          break;
        case 'openrouter':
          response = await sendMessageToOpenRouter(input, apiKeys.openrouter, messageSettings);
          break;
        default:
          throw new Error('Please select a valid AI provider in settings');
      }

      if (!response) {
        throw new Error('No response received from the AI provider');
      }

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (err) {
      console.error('Chat Error:', err);
      setError(err.message || 'An error occurred while processing your request');
      // Remove the user message if the AI response failed
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event);
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {messages.map((msg, index) => (
          <Box
            key={index}
            sx={{
              mb: 2,
              p: 2,
              borderRadius: 1,
              bgcolor: msg.role === 'assistant' ? 'action.selected' : 'background.paper',
              boxShadow: 1
            }}
          >
            <Typography
              component="div"
              sx={{
                '& code': {
                  display: 'block',
                  p: 1,
                  my: 1,
                  borderRadius: 1,
                  bgcolor: 'background.paper',
                  overflowX: 'auto'
                }
              }}
            >
              <ReactMarkdown
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={tomorrow}
                        language={match[1]}
                        PreTag="div"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {msg.content}
              </ReactMarkdown>
            </Typography>
          </Box>
        ))}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          p: 2,
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper'
        }}
      >
        <Box sx={{ mb: 2 }}>
          <FileUpload
            files={files}
            onFileSelect={handleFileSelect}
            onFileRemove={handleFileRemove}
            disabled={isLoading || !isVisionModel}
          />
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <IconButton
            color="primary"
            type="submit"
            disabled={isLoading || (!input.trim() && (!isVisionModel || !files.length))}
            sx={{ alignSelf: 'flex-end' }}
          >
            {isLoading ? (
              <CircularProgress size={24} />
            ) : (
              <SendIcon />
            )}
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}

export default ChatInterface;
