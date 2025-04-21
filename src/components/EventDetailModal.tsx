import React from 'react'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import { useTranslation } from 'react-i18next'
import { CalendarEvent } from '../contexts/ConfigContext' // Assuming type location

interface EventDetailModalProps {
  open: boolean
  event: CalendarEvent | null // Can be null when not open
  onClose: () => void
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  open,
  event,
  onClose,
}) => {
  const { t } = useTranslation()

  if (!event) {
    return null // Don't render anything if no event is selected
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('calendar.detailModalTitle', 'Event Details')}</DialogTitle>
      <DialogContent dividers>
        {' '}
        {/* Add dividers for better separation */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
            {t('calendar.labelEventTitle')}
          </Typography>
          <Typography variant="body1">{event.title}</Typography>
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
            {t('chat.eventDateLabel', 'Date')} {/* Reuse existing key */}
          </Typography>
          <Typography variant="body1">{event.date}</Typography>
        </Box>
        {event.description && ( // Only show description section if it exists
          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
              {t('calendar.labelEventDesc')}
            </Typography>
            {/* Preserve whitespace and line breaks in description */}
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {event.description}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          {' '}
          {/* Make close more prominent */}
          {t('common.close', 'Close')} {/* Add translation key */}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
