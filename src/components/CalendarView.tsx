'use client' // Required for react-day-picker interactions

import React, { useState, useEffect } from 'react'
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
  const { calendar, setCalendar, isLoading } = useConfig()

  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs())

  // Form state ONLY for title and description
  const [newEventTitle, setNewEventTitle] = useState<string>('')
  const [newEventDescription, setNewEventDescription] = useState<string>('')

  const allEvents = calendar?.events ?? []

  // Function to handle event deletion (moved before renderEvents)
  const handleDeleteEvent = async (eventIdToDelete: string) => {
    // Find the event title for the confirmation message
    const eventToDelete = (calendar?.events ?? []).find((e) => e.id === eventIdToDelete)
    const eventTitle = eventToDelete ? eventToDelete.title : 'this event'

    // Ask for confirmation
    if (window.confirm(`Are you sure you want to delete "${eventTitle}"?`)) {
      const currentEvents = calendar?.events ?? []
      const updatedEvents = currentEvents.filter(
        (event) => event.id !== eventIdToDelete
      )

      const updatedCalendarState: CalendarState = {
        events: updatedEvents,
      }

      try {
        await setCalendar(updatedCalendarState)
      } catch (error) {
        console.error('Failed to delete event:', error)
        alert('Failed to delete event. Check console for details.')
      }
    }
    // If user clicks Cancel in window.confirm, do nothing.
  }

  // Filter events for the selected date (for the list below)
  const eventsForSelectedDate = allEvents.filter(
    (event) => selectedDate && dayjs(event.date).isSame(selectedDate, 'day')
  )

  const renderEvents = (date: Dayjs | null, eventsToShow: CalendarEvent[]) => {
    if (!date) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Select a date to see events.
        </Typography>
      )
    }
    return (
      <>
        <Typography variant="subtitle1" gutterBottom>
          Events for {date.format('YYYY-MM-DD')}:
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
            {eventsToShow.map((event, index) => (
              <React.Fragment key={event.id}>
                <ListItem
                  disablePadding
                  secondaryAction={
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleDeleteEvent(event.id)}
                      size="small"
                      disabled={isLoading}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  }
                  sx={{ pl: 1 }}
                >
                  <ListItemText
                    primary={event.title}
                    secondary={event.description}
                    primaryTypographyProps={{ fontSize: '0.875rem' }}
                    secondaryTypographyProps={{ fontSize: '0.75rem' }}
                  />
                </ListItem>
                {index < eventsToShow.length - 1 && (
                  <Divider component="li" variant="inset" />
                )}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontStyle: 'italic' }}
          >
            No events for this date.
          </Typography>
        )}
      </>
    )
  }

  const handleAddEvent = async () => {
    if (!selectedDate) {
      alert('Please select a date on the calendar first.')
      return
    }
    if (!newEventTitle.trim()) {
      alert('Please provide a title for the event.')
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
      // Reset only title and description
      setNewEventTitle('')
      setNewEventDescription('')
    } catch (error) {
      console.error('Failed to save calendar:', error)
      alert('Failed to add event. Check console for details.')
    }
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
                Loading events...
              </Typography>
            ) : (
              renderEvents(selectedDate, eventsForSelectedDate)
            )}
          </Box>
        </Box>

        <Divider sx={{ width: '100%', my: 1 }} />

        {/* Bottom section: Add Event Form */}
        <Typography variant="subtitle1" sx={{ alignSelf: 'flex-start' }}>
          Add Event for{' '}
          {selectedDate ? selectedDate.format('YYYY-MM-DD') : 'selected date'}
        </Typography>
        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault()
            handleAddEvent()
          }}
          sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}
        >
          <TextField
            label="Event Title"
            variant="outlined"
            size="small"
            fullWidth
            required
            value={newEventTitle}
            onChange={(e) => setNewEventTitle(e.target.value)}
            disabled={isDisabled || !selectedDate}
          />
          <TextField
            label="Event Description (Optional)"
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
            {isLoading ? 'Loading...' : 'Add Event'}
          </Button>
        </Box>
      </Box>
    </LocalizationProvider>
  )
}
