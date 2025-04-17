import React, { useState, useEffect } from 'react'
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

// Define allowed holding types
const holdingTypes = [
  '活期存款', // Demand Deposit
  '现金理财', // Cash Management Product
  '债券', // Bonds
  '基金', // Funds
  '黄金', // Gold
] as const // Use const assertion for type safety

type HoldingType = (typeof holdingTypes)[number] // Create a union type

// Interface for the form input state
interface HoldingInput {
  type: HoldingType
  name: string
  amount: string // Keep amount as string for input handling
}

export function PortfolioManager() {
  const { portfolio, setPortfolio, isLoading } = useConfig()

  const holdings = portfolio?.holdings ?? []

  // Local state ONLY for the "add new" form
  const [newHoldingInput, setNewHoldingInput] = useState<HoldingInput>({
    type: '基金', // Default to Funds
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
      type: newHoldingInput.type,
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
      setNewHoldingInput({ type: '基金', name: '', amount: '' })
      // console.log('Adding holding:', holdingToAdd)
    } catch (error) {
      console.error('Failed to save portfolio:', error)
      alert('Failed to add holding. Check console for details.')
    }
  }

  // Generic handler for form inputs (TextField, Select)
  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
  ) => {
    const { name, value } = event.target
    setNewHoldingInput((prev) => ({ ...prev, [name!]: value }))
  }

  // TODO: Implement delete functionality if needed
  const handleDeleteHolding = async (holdingIdToDelete: string) => {
    console.log('Delete requested for:', holdingIdToDelete) // Placeholder
    if (!window.confirm('Are you sure you want to delete this holding?')) return
    const currentHoldings = portfolio?.holdings ?? []
    const updatedHoldings = currentHoldings.filter((h) => h.id !== holdingIdToDelete)
    const updatedPortfolioState: PortfolioState = { holdings: updatedHoldings }
    try {
      await setPortfolio(updatedPortfolioState)
    } catch (error) {
      console.error('Failed to delete holding:', error)
      alert('Failed to delete holding.')
    }
  }

  const isDisabled = isLoading

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <List dense sx={{ bgcolor: 'background.paper', borderRadius: 1, p: 0 }}>
        {isLoading ? (
          <ListItem>
            <ListItemText primary="Loading portfolio..." />
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
                  secondary={`金额: ${holding.amount}`}
                />
              </ListItem>
              {index < holdings.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))
        ) : (
          <ListItem>
            <ListItemText
              primary="No holdings added yet."
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
          <InputLabel id="holding-type-label">Type</InputLabel>
          <Select
            labelId="holding-type-label"
            id="type"
            name="type"
            value={newHoldingInput.type}
            label="Type"
            onChange={handleInputChange}
            required
          >
            {holdingTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          size="small"
          id="name"
          name="name"
          label="Name / Identifier"
          value={newHoldingInput.name}
          onChange={handleInputChange}
          placeholder="e.g., 招商银行活期, VTI, 工商银行债券"
          variant="outlined"
          disabled={isDisabled}
          required
        />

        <TextField
          fullWidth
          size="small"
          id="amount"
          name="amount"
          label="Amount (Cash Unit)"
          type="number"
          value={newHoldingInput.amount}
          onChange={handleInputChange}
          placeholder="e.g., 10000"
          variant="outlined"
          inputProps={{ step: 'any' }}
          disabled={isDisabled}
          required
        />

        <Button type="submit" variant="contained" fullWidth disabled={isDisabled}>
          {isLoading ? 'Loading...' : 'Add Holding'}
        </Button>
      </Box>
    </Box>
  )
}
