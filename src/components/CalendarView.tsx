'use client' // Required for react-day-picker interactions

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import dayjs, { Dayjs } from 'dayjs'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DateCalendar, PickersDayProps, PickersDay } from '@mui/x-date-pickers'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Badge from '@mui/material/Badge'
import IconButton from '@mui/material/IconButton'
import DeleteIcon from '@mui/icons-material/Delete'
import { useConfig } from '../contexts/ConfigContext'
import { CalendarEvent, CalendarState } from '../contexts/ConfigContext'
import { EventDetailModal } from './EventDetailModal'

// Custom Day component with Badge
interface DayWithBadgeProps extends PickersDayProps<Dayjs> {
  events?: CalendarEvent[]
}

function DayWithBadge(props: DayWithBadgeProps) {
  const { day, outsideCurrentMonth, events = [], ...other } = props

  const hasEvent =
    !outsideCurrentMonth && events.some((event) => dayjs(event.date).isSame(day, 'day'))

  return (
    <Badge
      key={day.toString()}
      overlap="circular"
      badgeContent={hasEvent ? '' : 0} // Empty string content for dot
      variant={hasEvent ? 'dot' : 'standard'}
      color="primary"
      sx={{
        '& .MuiBadge-dot': {
          height: 6,
          minWidth: 6,
          borderRadius: '50%',
          bottom: 4, // Adjust vertical position
          right: 4, // Adjust horizontal position
          // backgroundColor: 'secondary.main' // Example: change color
        },
      }}
    >
      <PickersDay {...other} outsideCurrentMonth={outsideCurrentMonth} day={day} />
    </Badge>
  )
}

export function CalendarView() {
  const { t } = useTranslation()
  const { calendar, setCalendar, deleteCalendarEvent, isLoading } = useConfig()

  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs())

  // Form state ONLY for title and description
  const [newEventTitle, setNewEventTitle] = useState<string>('')
  const [newEventDescription, setNewEventDescription] = useState<string>('')

  // State for the detail modal
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false)
  const [selectedEventForDetail, setSelectedEventForDetail] =
    useState<CalendarEvent | null>(null)

  const allEvents = calendar?.events ?? []

  // Function to handle event deletion
  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    if (isDisabled) return // Prevent action if loading
    if (window.confirm(t('calendar.confirmDelete', { title: eventTitle }))) {
      try {
        await deleteCalendarEvent(eventId)
        alert(t('calendar.alertDeleteSuccess'))
      } catch (error) {
        console.error('Failed to delete event:', error)
        alert(t('calendar.alertDeleteFailed'))
      }
    }
  }

  // Filter events for the selected date (for the list below)
  const eventsForSelectedDate = allEvents.filter(
    (event) => selectedDate && dayjs(event.date).isSame(selectedDate, 'day')
  )

  const renderEvents = (date: Dayjs | null, eventsToShow: CalendarEvent[]) => {
    if (!date) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {t('calendar.selectDatePrompt')}
        </Typography>
      )
    }
    return (
      <>
        <Typography variant="subtitle1" gutterBottom>
          {t('calendar.eventsForDate', { date: date.format('YYYY-MM-DD') })}
        </Typography>
        {eventsToShow.length > 0 ? (
          <List
            dense
            sx={{
              maxHeight: 280,
              overflow: 'auto',
              bgcolor: 'background.paper',
              borderRadius: 1,
              p: 0,
            }}
          >
            {eventsToShow.map((event) => (
              <ListItem
                key={event.id}
                disableGutters
                sx={{
                  maxWidth: '300px',
                  cursor: 'pointer', // Indicate it's clickable
                  '&:hover': { backgroundColor: 'action.hover' }, // Add hover effect
                }}
                onClick={() => handleOpenDetailModal(event)} // Open modal on click
                secondaryAction={
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteEvent(event.id, event.title)
                    }}
                    disabled={isDisabled}
                  >
                    <DeleteIcon fontSize="inherit" />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={event.title}
                  secondary={
                    event.description
                      ? event.description.substring(0, 50) +
                        (event.description.length > 50 ? '...' : '')
                      : null
                  }
                  // Truncate description after 50 chars
                  sx={{ pr: 4 }}
                  primaryTypographyProps={{ sx: { fontWeight: 'medium' } }} // Make title slightly bolder
                  secondaryTypographyProps={{
                    sx: {
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    },
                  }}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontStyle: 'italic' }}
          >
            {t('calendar.noEventsForDate')}
          </Typography>
        )}
      </>
    )
  }

  const handleAddEvent = async () => {
    if (isDisabled) return // Prevent action if loading
    if (!selectedDate) {
      alert(t('calendar.alertSelectDate'))
      return
    }
    if (!newEventTitle.trim()) {
      alert(t('calendar.alertProvideTitle'))
      return
    }

    const newEvent: CalendarEvent = {
      id: Date.now().toString(),
      date: selectedDate.format('YYYY-MM-DD'),
      title: newEventTitle.trim(),
      description: newEventDescription.trim() || null,
    }

    const currentEvents = calendar?.events ?? []
    const updatedCalendarState: CalendarState = {
      events: [...currentEvents, newEvent].sort((a, b) =>
        dayjs(a.date).diff(dayjs(b.date))
      ),
    }

    try {
      await setCalendar(updatedCalendarState)
      setNewEventTitle('')
      setNewEventDescription('')
    } catch (error) {
      console.error('Failed to save calendar:', error)
      alert(t('calendar.alertAddFailed'))
    }
  }

  // Handler to open the detail modal
  const handleOpenDetailModal = (event: CalendarEvent) => {
    setSelectedEventForDetail(event)
    setIsDetailModalOpen(true)
  }

  // Handler to close the detail modal
  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false)
    setSelectedEventForDetail(null)
  }

  const isDisabled = isLoading

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
        {/* Top section: Calendar (Left) and Event List (Right) */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            gap: 2,
            width: '100%',
            alignItems: 'flex-start',
          }}
        >
          {/* Left: Calendar */}
          <Paper elevation={1} sx={{ flexShrink: 0 }}>
            <DateCalendar
              value={selectedDate}
              onChange={(newValue) => setSelectedDate(newValue)}
              disabled={isDisabled}
              slots={{ day: DayWithBadge }}
              slotProps={{
                day: { events: allEvents } as any,
              }}
              sx={{ maxWidth: 320 }}
            />
          </Paper>

          {/* Right: Event List */}
          <Box sx={{ flexGrow: 1, mt: 1 }}>
            {isLoading ? (
              <Typography variant="body2" color="text.secondary">
                {t('calendar.loadingEvents')}
              </Typography>
            ) : (
              renderEvents(selectedDate, eventsForSelectedDate)
            )}
          </Box>
        </Box>

        <Divider sx={{ width: '100%', my: 1 }} />

        {/* Bottom section: Add Event Form */}
        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault()
            handleAddEvent()
          }}
          sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}
        >
          <TextField
            label={t('calendar.labelEventTitle')}
            variant="outlined"
            size="small"
            fullWidth
            required
            value={newEventTitle}
            onChange={(e) => setNewEventTitle(e.target.value)}
            disabled={isDisabled || !selectedDate}
          />
          <TextField
            label={t('calendar.labelEventDesc')}
            variant="outlined"
            size="small"
            fullWidth
            multiline
            rows={2}
            value={newEventDescription}
            onChange={(e) => setNewEventDescription(e.target.value)}
            disabled={isDisabled || !selectedDate}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={isDisabled || !selectedDate}
            size="medium"
          >
            {isLoading ? t('calendar.buttonLoading') : t('calendar.buttonAddEvent')}
          </Button>
        </Box>

        {/* Render the Detail Modal */}
        <EventDetailModal
          open={isDetailModalOpen}
          event={selectedEventForDetail}
          onClose={handleCloseDetailModal}
        />
      </Box>
    </LocalizationProvider>
  )
}
