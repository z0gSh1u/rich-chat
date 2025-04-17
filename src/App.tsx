import ChatPage from './components/ChatPage'
import { RightPanel } from './components/RightPanel'
import './App.css'
import { ConfigProvider } from './contexts/ConfigContext'
// MUI Imports
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import Box from '@mui/material/Box'

// Define MUI dark theme
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    // You can further customize the dark theme here
    // background: {
    //   default: '#121212',
    //   paper: '#1e1e1e',
    // },
  },
})

function App() {
  // No longer need useEffect to add 'dark' class

  return (
    <ConfigProvider>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline /> {/* Applies baseline styles & dark background */}
        <Box
          sx={{ display: 'flex', flexDirection: 'row', height: '100vh', width: '100%' }}
        >
          {/* Chat Panel (Left) */}
          <Box
            sx={{ flex: '3', height: '100%', borderRight: 1, borderColor: 'divider' }}
          >
            <ChatPage />
          </Box>
          {/* Right Accordion Panel (Right) */}
          <Box
            sx={{
              flex: '2',
              height: '100%',
              overflow: 'hidden' /* bg handled by theme */,
            }}
          >
            <RightPanel />
          </Box>
        </Box>
      </ThemeProvider>
    </ConfigProvider>
  )
}

export default App
