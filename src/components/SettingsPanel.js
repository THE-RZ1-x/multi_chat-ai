import React, { useState, useEffect } from 'react';
import {
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Box,
  Slider,
  Button,
  Snackbar,
  Alert,
  ListSubheader,
  Divider,
  IconButton,
  Tooltip,
  useTheme
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import SettingsIcon from '@mui/icons-material/Settings';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import TuneIcon from '@mui/icons-material/Tune';
import KeyIcon from '@mui/icons-material/Key';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { alpha } from '@mui/material/styles';
import axios from 'axios';

const models = [
  {
    id: 'google',
    name: 'Google Gemini',
    description: 'Google\'s latest AI models',
    subModels: [
      {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        description: 'Latest Gemini model for text generation'
      },
      {
        id: 'gemini-pro-vision',
        name: 'Gemini Pro Vision',
        description: 'Gemini model that can understand images and text'
      }
    ]
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-3.5 and GPT-4 models',
    subModels: [
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        description: 'Fast and efficient language model'
      },
      {
        id: 'gpt-4',
        name: 'GPT-4',
        description: 'Most capable OpenAI model'
      },
      {
        id: 'gpt-4-vision-preview',
        name: 'GPT-4 Vision',
        description: 'GPT-4 with image understanding capabilities'
      }
    ]
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    description: 'Run AI models locally on your machine',
    subModels: [
      {
        id: 'llama2',
        name: 'Llama 2',
        description: 'Meta\'s open source language model'
      },
      {
        id: 'mistral',
        name: 'Mistral',
        description: 'Efficient and powerful language model'
      },
      {
        id: 'codellama',
        name: 'Code Llama',
        description: 'Specialized for code generation'
      }
    ]
  },
  {
    id: 'huggingface',
    name: 'Hugging Face',
    description: 'Access to various open source models',
    subModels: [
      {
        id: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
        name: 'Mixtral 8x7B',
        description: 'Powerful mixture of experts model'
      },
      {
        id: 'meta-llama/Llama-2-70b-chat-hf',
        name: 'LLaMA2 70B',
        description: 'Largest LLaMA2 model'
      }
    ]
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'Specialized AI models',
    subModels: [
      {
        id: 'deepseek-chat',
        name: 'DeepSeek Chat',
        description: 'General purpose chat model'
      },
      {
        id: 'deepseek-coder',
        name: 'DeepSeek Coder',
        description: 'Specialized for code generation'
      }
    ]
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Access to various commercial models',
    subModels: [
      {
        id: 'openai/gpt-4-turbo',
        name: 'GPT-4 Turbo',
        description: 'Latest GPT-4 model via OpenRouter'
      },
      {
        id: 'anthropic/claude-2.1',
        name: 'Claude 2.1',
        description: 'Anthropic\'s latest model'
      },
      {
        id: 'google/gemini-pro',
        name: 'Gemini Pro',
        description: 'Google\'s latest model via OpenRouter'
      }
    ]
  }
];

function SettingsPanel({ settings = {}, apiKeys = {}, setApiKeys, onSettingsChange }) {
  const theme = useTheme();
  const [temperature, setTemperature] = useState(settings?.temperature || 0.7);
  const [maxTokens, setMaxTokens] = useState(settings?.maxTokens || 1000);
  const [systemPrompt, setSystemPrompt] = useState(settings?.systemPrompt || '');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState(null);
  const [localSelectedProvider, setLocalSelectedProvider] = useState(settings?.selectedProvider || '');
  const [localSelectedModel, setLocalSelectedModel] = useState(settings?.selectedModel || '');

  // Update local state when settings change
  useEffect(() => {
    setTemperature(settings?.temperature || 0.7);
    setMaxTokens(settings?.maxTokens || 1000);
    setSystemPrompt(settings?.systemPrompt || '');
    setLocalSelectedProvider(settings?.selectedProvider || '');
    setLocalSelectedModel(settings?.selectedModel || '');
  }, [settings]);

  const handleProviderChange = (event) => {
    const provider = event.target.value;
    setLocalSelectedProvider(provider);
    setLocalSelectedModel(''); // Clear model when provider changes
    
    // Update parent component and localStorage immediately
    const newSettings = {
      ...settings,
      selectedProvider: provider,
      selectedModel: ''
    };
    onSettingsChange(newSettings);
  };

  const handleModelChange = (event) => {
    const model = event.target.value;
    setLocalSelectedModel(model);
    
    // Update parent component and localStorage immediately
    const newSettings = {
      ...settings,
      selectedModel: model
    };
    onSettingsChange(newSettings);
  };

  const handleApiKeyChange = (provider, value) => {
    const newApiKeys = {
      ...apiKeys,
      [provider]: value
    };
    setApiKeys(newApiKeys);
    localStorage.setItem('windsurf_api_keys', JSON.stringify(newApiKeys));
  };

  const handleSave = () => {
    const newSettings = {
      ...settings,
      temperature,
      maxTokens,
      systemPrompt,
      selectedModel: localSelectedModel,
      selectedProvider: localSelectedProvider
    };
    
    // Save settings to localStorage
    localStorage.setItem('windsurf_settings', JSON.stringify(newSettings));
    
    // Save API keys separately
    localStorage.setItem('windsurf_api_keys', JSON.stringify(apiKeys));
    
    // Notify parent component
    onSettingsChange(newSettings);
    
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  // Get available models for the selected provider
  const getAvailableModels = () => {
    const provider = models.find(m => m.id === localSelectedProvider);
    return provider?.subModels || [];
  };

  const SectionTitle = ({ icon, title }) => (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 1,
      mb: 2,
      mt: 1
    }}>
      {icon}
      <Typography variant="h6" component="h2" sx={{ 
        fontWeight: 500,
        color: theme.palette.primary.main
      }}>
        {title}
      </Typography>
    </Box>
  );

  const renderOllamaStatus = () => {
    if (!ollamaStatus) return null;

    return (
      <Alert 
        severity={ollamaStatus.connected ? "success" : "error"}
        sx={{ mt: 2 }}
        action={
          !ollamaStatus.connected && (
            <Button 
              color="inherit" 
              size="small"
              onClick={() => window.open('https://ollama.ai/download', '_blank')}
            >
              Download Ollama
            </Button>
          )
        }
      >
        {ollamaStatus.connected ? 
          'Connected to Ollama' : 
          ollamaStatus.error
        }
      </Alert>
    );
  };

  const renderModelPullCommand = () => {
    if (localSelectedProvider !== 'ollama' || !localSelectedModel) return null;

    const model = models
      .find(m => m.id === 'ollama')
      ?.subModels.find(m => m.id === localSelectedModel);

    if (!model?.pullCommand) return null;

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" color="text.secondary">
          To use this model, run this command in your terminal:
        </Typography>
        <Paper
          sx={{
            mt: 1,
            p: 1,
            bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <code>{model.pullCommand}</code>
          <IconButton
            size="small"
            onClick={() => navigator.clipboard.writeText(model.pullCommand)}
            sx={{ ml: 'auto' }}
          >
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </Paper>
      </Box>
    );
  };

  return (
    <Paper 
      elevation={2}
      sx={{ 
        width: 380,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}
    >
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        bgcolor: 'background.paper',
        position: 'sticky',
        top: 0,
        zIndex: 1,
        boxShadow: 1
      }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Settings
        </Typography>
      </Box>

      {/* Scrollable Content */}
      <Box sx={{ 
        flex: 1,
        overflow: 'auto',
        p: 2
      }}>
        <Box sx={{ mb: 4 }}>
          <SectionTitle 
            icon={<SmartToyIcon />}
            title="Model Selection" 
          />
          
          <FormControl 
            fullWidth 
            variant="outlined" 
            sx={{ mb: 2 }}
          >
            <InputLabel>AI Provider</InputLabel>
            <Select
              value={localSelectedProvider}
              onChange={handleProviderChange}
              label="AI Provider"
            >
              {models.map(model => (
                <MenuItem 
                  key={model.id} 
                  value={model.id}
                  sx={{
                    py: 1.5,
                    borderRadius: 1
                  }}
                >
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                      {model.name}
                    </Typography>
                    {model.description && (
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ 
                          display: 'block',
                          mt: 0.5
                        }}
                      >
                        {model.description}
                      </Typography>
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {localSelectedProvider && getAvailableModels().length > 0 && (
            <FormControl 
              fullWidth 
              variant="outlined"
              sx={{ mb: 2 }}
            >
              <InputLabel>Model</InputLabel>
              <Select
                value={localSelectedModel}
                label="Model"
                onChange={handleModelChange}
              >
                {getAvailableModels().map(model => (
                  <MenuItem 
                    key={model.id} 
                    value={model.id}
                    sx={{
                      py: 1.5,
                      borderRadius: 1
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        {model.name}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ 
                          display: 'block',
                          mt: 0.5
                        }}
                      >
                        {model.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {localSelectedProvider === 'ollama' && (
            <Box sx={{ mb: 3 }}>
              {renderOllamaStatus()}
              {renderModelPullCommand()}
            </Box>
          )}
        </Box>

        {localSelectedProvider && localSelectedProvider !== 'ollama' && (
          <Box sx={{ mb: 4 }}>
            <SectionTitle 
              icon={<KeyIcon />}
              title="API Keys" 
            />
            <TextField
              label={`API Key${localSelectedProvider === 'google' ? ' (Google AI Studio)' : ''}`}
              type="password"
              value={apiKeys[localSelectedProvider] || ''}
              onChange={(e) => handleApiKeyChange(localSelectedProvider, e.target.value)}
              fullWidth
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          </Box>
        )}

        <Box sx={{ mb: 4 }}>
          <SectionTitle 
            icon={<TuneIcon />}
            title="Model Parameters" 
          />
          
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ mb: 2 }}
          >
            Temperature: {temperature}
          </Typography>
          <Slider
            value={temperature}
            onChange={(_, value) => setTemperature(value)}
            min={0}
            max={1}
            step={0.1}
            marks
            sx={{ mb: 3 }}
          />

          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ mb: 2 }}
          >
            Max Tokens: {maxTokens}
          </Typography>
          <Slider
            value={maxTokens}
            onChange={(_, value) => setMaxTokens(value)}
            min={100}
            max={4000}
            step={100}
            marks
            sx={{ mb: 3 }}
          />

          <TextField
            label="System Prompt"
            multiline
            rows={4}
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            fullWidth
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              }
            }}
          />
        </Box>
      </Box>

      {/* Footer with Save Button - Fixed at bottom */}
      <Box sx={{ 
        p: 2, 
        borderTop: 1, 
        borderColor: 'divider',
        bgcolor: 'background.paper',
        position: 'sticky',
        bottom: 0,
        zIndex: 1,
        boxShadow: '0px -4px 8px -4px rgba(0, 0, 0, 0.1)'
      }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          fullWidth
          sx={{ 
            py: 1.5,
            borderRadius: 2
          }}
        >
          Save Settings
        </Button>
        {showSaveSuccess && (
          <Alert 
            severity="success" 
            sx={{ 
              position: 'absolute',
              bottom: '100%',
              left: 0,
              right: 0,
              borderRadius: 0
            }}
          >
            Settings saved successfully!
          </Alert>
        )}
      </Box>
    </Paper>
  );
}

export default SettingsPanel;
