import React, { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'

export default function InvestmentStyleConfig() {
  // State for the investment style - load/save persistently later
  const [investmentStyle, setInvestmentStyle] = useState<string>('')

  const handleSaveStyle = () => {
    // Placeholder for saving the style
    console.log('Saving investment style:', investmentStyle)
    alert('Investment style saved (placeholder - check console)')
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6">Personal Investment Style</Typography>
      <TextField
        fullWidth
        id="investmentStyle"
        label="Describe your investment style in one sentence"
        value={investmentStyle}
        onChange={(e) => setInvestmentStyle(e.target.value)}
        placeholder="e.g., Long-term growth focused, value investor, dividend seeker..."
        variant="outlined"
        size="small"
        multiline // Allow multiline just in case, though user asked for sentence
        rows={3} // Start with a few rows
        helperText="This helps the AI tailor advice to your preferences. (Persistence not yet implemented)"
      />
      <Button variant="contained" onClick={handleSaveStyle}>
        Save Style
      </Button>
    </Box>
  )
}
