import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import { useConfig } from '../contexts/ConfigContext'

export function SystemConfig() {
  const { t, i18n } = useTranslation()
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
      alert(t('systemConfig.alertSaveSuccess'))
    } catch (error) {
      console.error('Failed to save configuration:', error)
      alert(t('systemConfig.alertSaveFailed'))
    }
  }

  // Handler for language change
  const handleLanguageChange = (event: SelectChangeEvent<string>) => {
    const newLang = event.target.value
    i18n.changeLanguage(newLang)
  }

  // Disable inputs/button while loading initial config
  const isDisabled = isLoading

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Language Selection */}
      <FormControl fullWidth size="small" disabled={isDisabled}>
        <InputLabel id="language-select-label">{t('language')}</InputLabel>
        <Select
          labelId="language-select-label"
          id="language-select"
          value={i18n.language.split('-')[0]}
          label={t('language')}
          onChange={handleLanguageChange}
        >
          <MenuItem value="en">English</MenuItem>
          <MenuItem value="zh">中文 (Chinese)</MenuItem>
        </Select>
      </FormControl>

      <TextField
        fullWidth
        id="apiToken"
        label={t('systemConfig.labelApiKey')}
        type="password"
        value={apiTokenInput}
        onChange={(e) => setApiTokenInput(e.target.value)}
        placeholder={t('systemConfig.placeholderApiKey')}
        variant="outlined"
        size="small"
        disabled={isDisabled}
      />
      <TextField
        fullWidth
        id="endpointUrl"
        label={t('systemConfig.labelEndpointUrl')}
        type="url"
        value={endpointUrlInput}
        onChange={(e) => setEndpointUrlInput(e.target.value)}
        placeholder={t('systemConfig.placeholderEndpointUrl')}
        variant="outlined"
        size="small"
        disabled={isDisabled}
      />
      <Button variant="contained" onClick={handleSaveConfig} disabled={isDisabled}>
        {isLoading ? t('systemConfig.buttonLoading') : t('systemConfig.buttonSave')}
      </Button>
    </Box>
  )
}
