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
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import DeleteIcon from '@mui/icons-material/Delete'
import { useConfig } from '../contexts/ConfigContext'
import { Holding, PortfolioState } from '../contexts/ConfigContext'

// Define allowed holding type *keys* for internal use
const holdingTypeKeys = [
  'demandDeposit',
  'cashManagement',
  'bonds',
  'funds',
  'gold',
] as const

type HoldingTypeKey = (typeof holdingTypeKeys)[number]

// Map keys to translated display names
const getHoldingTypeDisplay = (t: Function, key: HoldingTypeKey): string => {
  return t(`holdingType.${key}`)
}

// Interface for the form input state
interface HoldingInput {
  typeKey: HoldingTypeKey // Use key internally
  name: string
  amount: string // Keep amount as string for input handling
}

export function PortfolioManager() {
  const { t } = useTranslation()
  const { portfolio, setPortfolio, isLoading } = useConfig()

  const holdings = portfolio?.holdings ?? []

  // Local state ONLY for the "add new" form
  const [newHoldingInput, setNewHoldingInput] = useState<HoldingInput>({
    typeKey: 'funds', // Default to Funds key
    name: '',
    amount: '',
  })

  const handleAddHolding = async () => {
    if (
      !newHoldingInput.name ||
      !newHoldingInput.amount ||
      isNaN(parseFloat(newHoldingInput.amount))
    )
      return

    const holdingToAdd: Holding = {
      id: Date.now().toString(), // Generate unique ID
      // Save the translated type string when adding
      type: getHoldingTypeDisplay(t, newHoldingInput.typeKey),
      name: newHoldingInput.name.trim(),
      amount: parseFloat(newHoldingInput.amount),
    }

    const currentHoldings = portfolio?.holdings ?? []
    const updatedPortfolioState: PortfolioState = {
      holdings: [...currentHoldings, holdingToAdd],
    }

    try {
      await setPortfolio(updatedPortfolioState)
      // Reset form
      setNewHoldingInput({ typeKey: 'funds', name: '', amount: '' })
    } catch (error) {
      console.error('Failed to save portfolio:', error)
      alert(t('portfolio.alertAddFailed'))
    }
  }

  // Generic handler for form inputs (TextField, Select)
  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
  ) => {
    const { name, value } = event.target
    // Special handling for the type dropdown
    const fieldName = name === 'type' ? 'typeKey' : name
    setNewHoldingInput((prev) => ({ ...prev, [fieldName!]: value }))
  }

  const handleDeleteHolding = async (holdingIdToDelete: string) => {
    console.log('Delete requested for:', holdingIdToDelete) // Placeholder
    if (!window.confirm(t('portfolio.confirmDelete'))) return
    const currentHoldings = portfolio?.holdings ?? []
    const updatedHoldings = currentHoldings.filter((h) => h.id !== holdingIdToDelete)
    const updatedPortfolioState: PortfolioState = { holdings: updatedHoldings }
    try {
      await setPortfolio(updatedPortfolioState)
    } catch (error) {
      console.error('Failed to delete holding:', error)
      alert(t('portfolio.alertDeleteFailed'))
    }
  }

  const isDisabled = isLoading

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <List dense sx={{ bgcolor: 'background.paper', borderRadius: 1, p: 0 }}>
        {isLoading ? (
          <ListItem>
            <ListItemText primary={t('portfolio.loading')} />
          </ListItem>
        ) : holdings.length > 0 ? (
          holdings.map((holding, index) => (
            <React.Fragment key={holding.id}>
              <ListItem
                secondaryAction={
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleDeleteHolding(holding.id)}
                    disabled={isDisabled}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={`${holding.type}: ${holding.name}`}
                  secondary={`${t('portfolio.amountPrefix')}${holding.amount}`}
                />
              </ListItem>
              {index < holdings.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))
        ) : (
          <ListItem>
            <ListItemText
              primary={t('portfolio.noHoldings')}
              sx={{ color: 'text.secondary' }}
            />
          </ListItem>
        )}
      </List>

      {/* Form to add new holding */}
      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault()
          handleAddHolding()
        }}
        sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
      >
        <FormControl fullWidth size="small" disabled={isDisabled}>
          <InputLabel id="holding-type-label">{t('portfolio.labelType')}</InputLabel>
          <Select
            labelId="holding-type-label"
            id="type"
            name="type"
            value={newHoldingInput.typeKey}
            label={t('portfolio.labelType')}
            onChange={handleInputChange}
            required
          >
            {holdingTypeKeys.map((typeKey) => (
              <MenuItem key={typeKey} value={typeKey}>
                {getHoldingTypeDisplay(t, typeKey)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          size="small"
          id="name"
          name="name"
          label={t('portfolio.labelName')}
          value={newHoldingInput.name}
          onChange={handleInputChange}
          placeholder={t('portfolio.placeholderName')}
          variant="outlined"
          disabled={isDisabled}
          required
        />

        <TextField
          fullWidth
          size="small"
          id="amount"
          name="amount"
          label={t('portfolio.labelAmount')}
          type="number"
          value={newHoldingInput.amount}
          onChange={handleInputChange}
          placeholder={t('portfolio.placeholderAmount')}
          variant="outlined"
          inputProps={{ step: 'any' }}
          disabled={isDisabled}
          required
        />

        <Button type="submit" variant="contained" fullWidth disabled={isDisabled}>
          {isLoading ? t('portfolio.buttonLoading') : t('portfolio.buttonAddHolding')}
        </Button>
      </Box>
    </Box>
  )
}
