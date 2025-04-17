import React, { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import { useConfig } from '../contexts/ConfigContext'
import { InvestmentStyleState } from '../contexts/ConfigContext'

export default function InvestmentStyleConfig() {
  const { investmentStyle, setInvestmentStyle, isLoading } = useConfig()

  // Local state for the input, initialized from context
  const [styleInput, setStyleInput] = useState<string>('')

  useEffect(() => {
    if (!isLoading && investmentStyle) {
      setStyleInput(investmentStyle.style_description || '')
    } else if (!isLoading && !investmentStyle) {
      setStyleInput('')
    }
  }, [investmentStyle, isLoading])

  const handleSaveStyle = async () => {
    const styleToSave: InvestmentStyleState = {
      style_description: styleInput.trim() || null,
    }
    try {
      await setInvestmentStyle(styleToSave)
      alert('Investment style saved successfully!')
    } catch (error) {
      console.error('Failed to save style:', error)
      alert('Failed to save investment style. Check console for details.')
    }
  }

  const isDisabled = isLoading

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        fullWidth
        id="investmentStyle"
        label="Describe your investment style"
        value={styleInput}
        onChange={(e) => setStyleInput(e.target.value)}
        placeholder="e.g., Long-term growth focused..."
        variant="outlined"
        size="small"
        multiline
        rows={3}
        helperText="This helps the AI tailor advice to your preferences."
        disabled={isDisabled}
      />
      <Button variant="contained" onClick={handleSaveStyle} disabled={isDisabled}>
        {isLoading ? 'Loading...' : 'Save Style'}
      </Button>
    </Box>
  )
}
