import React, { useState, useEffect } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Chip from '@mui/material/Chip'
import { useTranslation } from 'react-i18next'

interface EditingEvent {
  id?: string
  title: string
  date: string // YYYY-MM-DD format
  description: string | null
}

interface EventEditModalProps {
  open: boolean
  event: EditingEvent
  onClose: () => void
  onSave: (eventData: EditingEvent) => void
}

export const EventEditModal: React.FC<EventEditModalProps> = ({
  open,
  event,
  onClose,
  onSave,
}) => {
  const { t } = useTranslation()
  const [title, setTitle] = useState(event.title)
  const [description, setDescription] = useState(event.description || '')

  // Update local state if the event prop changes (e.g., opening modal for a different event)
  useEffect(() => {
    setTitle(event.title)
    setDescription(event.description || '')
  }, [event])

  const handleSave = () => {
    onSave({
      ...event,
      title: title.trim(),
      description: description.trim() || null, // Save as null if empty
    })
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('chat.editEventTitle', 'Edit Calendar Event')}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          id="title"
          label={t('calendar.labelEventTitle')}
          type="text"
          fullWidth
          variant="standard"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        {/* Preset Title Chips */}
        <Stack direction="row" spacing={1} sx={{ mt: 1, mb: 1 }}>
          <Chip
            label={t('chat.presetTitleNews', '今日新闻总结')}
            size="small"
            onClick={() => setTitle(t('chat.presetTitleNews', '今日新闻总结'))}
          />
          <Chip
            label={t('chat.presetTitleAdvice', '今日投资建议')}
            size="small"
            onClick={() => setTitle(t('chat.presetTitleAdvice', '今日投资建议'))}
          />
        </Stack>
        <TextField
          margin="dense"
          id="description"
          label={t('calendar.labelEventDesc')}
          type="text"
          fullWidth
          multiline
          rows={3}
          variant="standard"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <TextField
          margin="dense"
          id="date"
          label={t('chat.eventDateLabel', 'Date')}
          type="text"
          fullWidth
          variant="standard"
          value={event.date}
          InputProps={{
            readOnly: true,
          }}
          disabled
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel', 'Cancel')}</Button>
        <Button onClick={handleSave} variant="contained">
          {t('common.save', 'Save')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
