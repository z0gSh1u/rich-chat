import React, { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import { useConfig } from '../contexts/ConfigContext'

export function SystemConfig() {
  // Get state and functions from context
  const { apiKey: storedApiKey, setApiKey, isLoading } = useConfig()
  // Local state for the input field, initialized from context
  const [apiTokenInput, setApiTokenInput] = useState<string>('')

  // Effect to update local state when context data loads/changes
  useEffect(() => {
    if (!isLoading && storedApiKey !== null) {
      setApiTokenInput(storedApiKey)
    }
    // If context is loaded and key is null, ensure input is empty
    else if (!isLoading && storedApiKey === null) {
      setApiTokenInput('')
    }
  }, [storedApiKey, isLoading])

  const handleSaveToken = async () => {
    // Trim whitespace and save null if empty
    const tokenToSave = apiTokenInput.trim() || null
    try {
      await setApiKey(tokenToSave) // Call the context function to save
      alert('Token saved successfully!') // Provide feedback
    } catch (error) {
      console.error('Failed to save token:', error)
      alert('Failed to save token. Check console for details.')
    }
  }

  // Disable input/button while loading initial config
  const isDisabled = isLoading

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6">LLM Configuration</Typography>
      <TextField
        fullWidth
        id="apiToken"
        label="API Token"
        type="password" // Use password type to obscure the token
        value={apiTokenInput} // Use local state for input value
        onChange={(e) => setApiTokenInput(e.target.value)} // Update local state
        placeholder="Enter your Large Language Model API token"
        variant="outlined"
        size="small"
        helperText="Your token will be used for chat communication."
        disabled={isDisabled}
      />
      <Button variant="contained" onClick={handleSaveToken} disabled={isDisabled}>
        {isLoading ? 'Loading...' : 'Save Token'}
      </Button>
    </Box>
  )
}
