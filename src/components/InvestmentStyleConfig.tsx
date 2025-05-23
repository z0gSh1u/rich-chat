import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import IconButton from '@mui/material/IconButton'
import DeleteIcon from '@mui/icons-material/Delete'
import { useConfig } from '../contexts/ConfigContext'
import { InvestmentStyleState, InvestmentStyleItem } from '../contexts/ConfigContext'

export default function InvestmentStyleConfig() {
  const { t } = useTranslation()
  const { investmentStyle, setInvestmentStyle, isLoading } = useConfig()

  // Use context state for the list of items
  const styleItems = investmentStyle?.items ?? []

  // Local state ONLY for the input field
  const [styleInput, setStyleInput] = useState<string>('')

  const handleAddStyle = async () => {
    const description = styleInput.trim()
    if (!description) return // Don't add empty styles

    const newItem: InvestmentStyleItem = {
      id: Date.now().toString(), // Simple unique ID
      description: description,
    }

    const currentItems = investmentStyle?.items ?? []
    const updatedStyleState: InvestmentStyleState = {
      items: [...currentItems, newItem], // Add new item to the list
    }

    try {
      await setInvestmentStyle(updatedStyleState)
      setStyleInput('') // Clear input on success
    } catch (error) {
      console.error('Failed to add style:', error)
      alert(t('investStyle.alertAddFailed'))
    }
  }

  const handleDeleteStyle = async (itemIdToDelete: string) => {
    const itemToDelete = styleItems.find((item) => item.id === itemIdToDelete)
    if (!itemToDelete) return

    if (
      window.confirm(
        t('investStyle.confirmDelete', { description: itemToDelete.description })
      )
    ) {
      const currentItems = investmentStyle?.items ?? []
      const updatedItems = currentItems.filter((item) => item.id !== itemIdToDelete)
      const updatedStyleState: InvestmentStyleState = {
        items: updatedItems,
      }
      try {
        await setInvestmentStyle(updatedStyleState)
      } catch (error) {
        console.error('Failed to delete style:', error)
        alert(t('investStyle.alertDeleteFailed'))
      }
    }
  }

  const isDisabled = isLoading

  // Log the items being rendered
  console.log('Rendering Investment Style Items:', styleItems)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Display Saved Styles */}
      <List dense sx={{ bgcolor: 'background.paper', borderRadius: 1, p: 0 }}>
        {isLoading ? (
          <ListItem>
            <ListItemText primary={t('investStyle.loadingStyles')} />
          </ListItem>
        ) : styleItems.length > 0 ? (
          styleItems.map((item, index) => (
            <React.Fragment key={item.id}>
              <ListItem
                secondaryAction={
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleDeleteStyle(item.id)}
                    disabled={isDisabled}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                }
                sx={{ pl: 1 }}
              >
                <ListItemText primary={item.description} />
              </ListItem>
              {index < styleItems.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))
        ) : (
          <ListItem>
            <ListItemText
              primary={t('investStyle.noStyles')}
              sx={{ color: 'text.secondary', fontStyle: 'italic' }}
            />
          </ListItem>
        )}
      </List>

      {/* Add Style Form */}
      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault()
          handleAddStyle()
        }}
        sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
      >
        <TextField
          fullWidth
          id="investmentStyleInput"
          label={t('investStyle.inputLabel')}
          value={styleInput}
          onChange={(e) => setStyleInput(e.target.value)}
          placeholder={t('investStyle.inputPlaceholder')}
          variant="outlined"
          size="small"
          multiline
          rows={2} // Keep multiline brief for list items
          disabled={isDisabled}
        />
        <Button type="submit" variant="contained" disabled={isDisabled}>
          {isLoading ? t('investStyle.buttonLoading') : t('investStyle.buttonAddStyle')}
        </Button>
      </Box>
    </Box>
  )
}
