import React, { useState, useEffect } from 'react';
import { 
  ThemeProvider, 
  createTheme, 
  Box, 
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  useMediaQuery,
  Container,
  Paper,
  Drawer
} from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SettingsIcon from '@mui/icons-material/Settings';
import ChatInterface from './components/ChatInterface';
import SettingsPanel from './components/SettingsPanel';

function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [darkMode, setDarkMode] = useState(prefersDarkMode);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem('windsurf_settings');
    return savedSettings ? JSON.parse(savedSettings) : {
      temperature: 0.7,
      maxTokens: 1000,
      systemPrompt: '',
      selectedProvider: '',
      selectedModel: ''
    };
  });
  
  const [apiKeys, setApiKeys] = useState(() => {
    const savedApiKeys = localStorage.getItem('windsurf_api_keys');
    return savedApiKeys ? JSON.parse(savedApiKeys) : {};
  });

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? 'dark' : 'light',
          primary: {
            main: '#2196f3',
          },
          secondary: {
            main: '#f50057',
          },
          background: {
            default: darkMode ? '#121212' : '#f5f5f5',
            paper: darkMode ? '#1e1e1e' : '#ffffff',
          },
        },
        typography: {
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        },
        shape: {
          borderRadius: 8,
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
              },
            },
          },
        },
      }),
    [darkMode]
  );

  const handleSettingsChange = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('windsurf_settings', JSON.stringify(newSettings));
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  useEffect(() => {
    const savedSettings = localStorage.getItem('windsurf_settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(parsed);
    }

    const savedApiKeys = localStorage.getItem('windsurf_api_keys');
    if (savedApiKeys) {
      setApiKeys(JSON.parse(savedApiKeys));
    }
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar
          position="fixed"
          sx={{
            backgroundColor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open settings"
              onClick={() => setDrawerOpen(true)}
              edge="start"
              sx={{ mr: 2 }}
            >
              <SettingsIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'text.primary' }}>
              Windsurf Chat
            </Typography>
            <IconButton onClick={() => setDarkMode(!darkMode)} color="inherit">
              {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Toolbar>
        </AppBar>

        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={handleDrawerClose}
        >
          <SettingsPanel
            settings={settings}
            apiKeys={apiKeys}
            setApiKeys={setApiKeys}
            onSettingsChange={handleSettingsChange}
          />
        </Drawer>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: '100%',
            height: '100vh',
            pt: 8
          }}
        >
          <ChatInterface
            settings={settings}
            apiKeys={apiKeys}
          />
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
