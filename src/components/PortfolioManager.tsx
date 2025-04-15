import React, { useState } from 'react'
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

// Simplified portfolio structure for now
interface Position {
  id: string
  type: 'Cash' | 'Bonds' | 'Funds' | 'Gold' | 'Stocks'
  name: string // e.g., Fund Ticker, Stock Symbol, Bond Name
  amount: number // or units
}

const positionTypes: Position['type'][] = ['Cash', 'Bonds', 'Funds', 'Gold', 'Stocks']

export function PortfolioManager() {
  const [positions, setPositions] = useState<Position[]>([
    // Example data
    { id: '1', type: 'Stocks', name: 'AAPL', amount: 10 },
    { id: '2', type: 'Funds', name: 'VTI', amount: 50 },
  ])
  const [newPosition, setNewPosition] = useState({
    type: 'Stocks',
    name: '',
    amount: '',
  })

  const handleAddPosition = () => {
    if (
      !newPosition.name ||
      !newPosition.amount ||
      isNaN(parseFloat(newPosition.amount))
    )
      return
    const positionToAdd: Position = {
      id: Date.now().toString(), // Simple unique ID
      type: newPosition.type as Position['type'],
      name: newPosition.name,
      amount: parseFloat(newPosition.amount),
    }
    setPositions([...positions, positionToAdd])
    // Reset form
    setNewPosition({ type: 'Stocks', name: '', amount: '' })
    console.log('Adding position:', positionToAdd) // Log adding
  }

  const handleSelectChange = (event: SelectChangeEvent) => {
    const { name, value } = event.target
    setNewPosition((prev) => ({ ...prev, [name]: value }))
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setNewPosition((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6">Portfolio Holdings</Typography>

      {/* Display current positions */}
      <List dense sx={{ bgcolor: 'background.paper', borderRadius: 1, p: 0 }}>
        {positions.length > 0 ? (
          positions.map((pos, index) => (
            <React.Fragment key={pos.id}>
              <ListItem>
                <ListItemText
                  primary={`${pos.type}: ${pos.name}`}
                  secondary={`Amount: ${pos.amount}`}
                />
                {/* Add Edit/Delete IconButton here later if needed */}
              </ListItem>
              {index < positions.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))
        ) : (
          <ListItem>
            <ListItemText
              primary="No positions added yet."
              sx={{ color: 'text.secondary' }}
            />
          </ListItem>
        )}
      </List>

      {/* Form to add new position */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          pt: 2,
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="subtitle1">Add New Position</Typography>

        <FormControl fullWidth size="small">
          <InputLabel id="position-type-label">Type</InputLabel>
          <Select
            labelId="position-type-label"
            id="type"
            name="type"
            value={newPosition.type}
            label="Type"
            onChange={handleSelectChange}
          >
            {positionTypes.map((type) => (
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
          label="Name/Ticker"
          value={newPosition.name}
          onChange={handleInputChange}
          placeholder="e.g., AAPL, VTI"
          variant="outlined"
        />

        <TextField
          fullWidth
          size="small"
          id="amount"
          name="amount"
          label="Amount/Units"
          type="number"
          value={newPosition.amount}
          onChange={handleInputChange}
          placeholder="e.g., 10"
          variant="outlined"
          inputProps={{ step: 'any' }} // Allow decimals if needed
        />

        <Button variant="contained" onClick={handleAddPosition} fullWidth>
          Add Position
        </Button>
      </Box>
    </Box>
  )
}
