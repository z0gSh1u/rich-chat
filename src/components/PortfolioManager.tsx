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
import { useConfig } from '../contexts/ConfigContext'
import { Holding, PortfolioState } from '../contexts/ConfigContext'

// Renamed interface to avoid conflict with imported type
interface PositionInput {
  type: 'Cash' | 'Bonds' | 'Funds' | 'Gold' | 'Stocks'
  name: string
  amount: string // Keep amount as string for input handling
}

const positionTypes: PositionInput['type'][] = [
  'Cash',
  'Bonds',
  'Funds',
  'Gold',
  'Stocks',
]

export function PortfolioManager() {
  const { portfolio, setPortfolio, isLoading } = useConfig()

  // Use context state for positions, default to empty array if null/loading
  const positions = portfolio?.holdings ?? []

  // Local state ONLY for the "add new" form
  const [newPositionInput, setNewPositionInput] = useState<PositionInput>({
    type: 'Stocks',
    name: '',
    amount: '',
  })

  const handleAddPosition = async () => {
    if (
      !newPositionInput.name ||
      !newPositionInput.amount ||
      isNaN(parseFloat(newPositionInput.amount))
    )
      return

    // Create the new Holding based on the input
    const holdingToAdd: Holding = {
      // id: Date.now().toString(), // We don't have an ID in the Holding struct, maybe add later if needed for deletion/editing
      ticker: newPositionInput.name, // Assuming name is the ticker for Stocks/Funds
      quantity: parseFloat(newPositionInput.amount),
      purchase_price: 0, // Need a way to input purchase price, defaulting to 0 for now
      // We might need to adjust the Holding structure or the form to capture more info
      // and differentiate between types (e.g., ticker for stock, name for bond)
    }

    // Update the context state
    const currentHoldings = portfolio?.holdings ?? []
    const updatedPortfolioState: PortfolioState = {
      holdings: [...currentHoldings, holdingToAdd],
    }

    try {
      await setPortfolio(updatedPortfolioState)
      // Reset form only on successful save
      setNewPositionInput({ type: 'Stocks', name: '', amount: '' })
      console.log('Adding position:', holdingToAdd)
    } catch (error) {
      console.error('Failed to save portfolio:', error)
      alert('Failed to add position. Check console for details.')
    }
  }

  const handleSelectChange = (event: SelectChangeEvent) => {
    const { name, value } = event.target
    setNewPositionInput((prev) => ({ ...prev, [name!]: value })) // Use non-null assertion for name if confident
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setNewPositionInput((prev) => ({ ...prev, [name]: value }))
  }

  const isDisabled = isLoading // Disable form while loading initial config

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Display current positions */}
      <List dense sx={{ bgcolor: 'background.paper', borderRadius: 1, p: 0 }}>
        {isLoading ? (
          <ListItem>
            <ListItemText primary="Loading portfolio..." />
          </ListItem>
        ) : positions.length > 0 ? (
          positions.map((pos, index) => (
            <React.Fragment key={`${pos.ticker}-${index}`}>
              {' '}
              {/* Use a more stable key if possible */}
              <ListItem>
                <ListItemText
                  primary={`${pos.ticker}`}
                  secondary={`Quantity: ${pos.quantity}, Purchase Price: ${pos.purchase_price}`}
                />
                {/* Add Edit/Delete IconButton here later */}
              </ListItem>
              {index < positions.length - 1 && <Divider component="li" />}
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

      {/* Form to add new position */}
      <Box
        component="form" // Use form element for better semantics
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          // pt: 2, // Padding handled by Typography above
          // borderTop: 1,
          // borderColor: 'divider',
        }}
        onSubmit={(e) => {
          e.preventDefault()
          handleAddPosition()
        }} // Handle submit
      >
        {/* Removed Type selector for now as Holding struct needs refinement */}
        {/* <FormControl fullWidth size="small" disabled={isDisabled}> ... </FormControl> */}

        <TextField
          fullWidth
          size="small"
          id="name"
          name="name"
          label="Ticker Symbol"
          value={newPositionInput.name}
          onChange={handleInputChange}
          placeholder="e.g., AAPL, VTI"
          variant="outlined"
          disabled={isDisabled}
          required // Add basic form validation
        />

        <TextField
          fullWidth
          size="small"
          id="amount"
          name="amount"
          label="Quantity"
          type="number"
          value={newPositionInput.amount}
          onChange={handleInputChange}
          placeholder="e.g., 10"
          variant="outlined"
          inputProps={{ step: 'any' }}
          disabled={isDisabled}
          required
        />
        {/* Add field for purchase price if needed */}
        {/* <TextField ... /> */}

        <Button type="submit" variant="contained" fullWidth disabled={isDisabled}>
          {isLoading ? 'Loading...' : 'Add Holding'} {/* Update button text */}
        </Button>
      </Box>
    </Box>
  )
}
