import React, { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import { useConfig } from '../contexts/ConfigContext'

export function SystemConfig() {
  // Get state and functions from context
  const {
    apiKey: storedApiKey,
    endpointUrl: storedEndpointUrl,
    setApiKey,
    setEndpointUrl,
    isLoading,
  } = useConfig()

  // Local state for the input fields, initialized from context
  const [apiTokenInput, setApiTokenInput] = useState<string>('')
  const [endpointUrlInput, setEndpointUrlInput] = useState<string>('')

  // Effect to update local state when context data loads/changes
  useEffect(() => {
    if (!isLoading) {
      setApiTokenInput(storedApiKey || '')
      setEndpointUrlInput(storedEndpointUrl || '')
    }
  }, [storedApiKey, storedEndpointUrl, isLoading])

  const handleSaveConfig = async () => {
    const tokenToSave = apiTokenInput.trim() || null
    const urlToSave = endpointUrlInput.trim() || null
    try {
      await setApiKey(tokenToSave)
      await setEndpointUrl(urlToSave)
      alert('Configuration saved successfully!')
    } catch (error) {
      console.error('Failed to save configuration:', error)
      alert('Failed to save configuration. Check console for details.')
    }
  }

  // Disable inputs/button while loading initial config
  const isDisabled = isLoading

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        fullWidth
        id="apiToken"
        label="LLM API Key"
        type="password"
        value={apiTokenInput}
        onChange={(e) => setApiTokenInput(e.target.value)}
        placeholder="Enter your LLM API key"
        variant="outlined"
        size="small"
        disabled={isDisabled}
      />
      <TextField
        fullWidth
        id="endpointUrl"
        label="LLM API Endpoint URL"
        type="url"
        value={endpointUrlInput}
        onChange={(e) => setEndpointUrlInput(e.target.value)}
        placeholder="e.g., https://api.deepseek.com/v1/chat/completions"
        variant="outlined"
        size="small"
        disabled={isDisabled}
      />
      <Button variant="contained" onClick={handleSaveConfig} disabled={isDisabled}>
        {isLoading ? 'Loading...' : 'Save Configuration'}
      </Button>
    </Box>
  )
}
