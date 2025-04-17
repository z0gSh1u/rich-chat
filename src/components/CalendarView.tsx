'use client' // Required for react-day-picker interactions

import React, { useState, useEffect } from 'react'
import dayjs, { Dayjs } from 'dayjs'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import { useConfig } from '../contexts/ConfigContext'
import { CalendarEvent, CalendarState } from '../contexts/ConfigContext'

export function CalendarView() {
  const { calendar, setCalendar, isLoading } = useConfig()

  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs())

  // State for the "Add Event" form
  const [newEventDate, setNewEventDate] = useState<Dayjs | null>(dayjs())
  const [newEventTitle, setNewEventTitle] = useState<string>('')
  const [newEventDescription, setNewEventDescription] = useState<string>('')

  const allEvents = calendar?.events ?? []

  // Filter events for the selected date
  const eventsForSelectedDate = allEvents.filter((event) =>
    dayjs(event.date).isSame(selectedDate, 'day')
  )

  const renderEvents = (date: Dayjs | null, eventsToShow: CalendarEvent[]) => {
    if (!date) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Select a date to see events.
        </Typography>
      )
    }

    return (
      <Box sx={{ mt: 2, width: '100%' }}>
        {' '}
        {/* Ensure box takes width */}
        <Typography variant="subtitle1" gutterBottom>
          Events for {date.format('YYYY-MM-DD')}:
        </Typography>
        {eventsToShow.length > 0 ? (
          <List
            dense
            sx={{
              maxHeight: 150,
              overflow: 'auto',
              bgcolor: 'background.paper',
              borderRadius: 1,
              p: 0, // Remove padding if using Divider
            }}
          >
            {eventsToShow.map((event, index) => (
              <React.Fragment key={event.id}>
                <ListItem disablePadding>
                  <ListItemText
                    primary={event.title}
                    secondary={event.description}
                    primaryTypographyProps={{ fontSize: '0.875rem' }}
                    secondaryTypographyProps={{ fontSize: '0.75rem' }}
                  />
                </ListItem>
                {index < eventsToShow.length - 1 && <Divider component="li" />}
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
      </Box>
    )
  }

  const handleAddEvent = async () => {
    if (!newEventDate || !newEventTitle.trim()) {
      alert('Please provide a date and title for the event.')
      return
    }

    const newEvent: CalendarEvent = {
      id: Date.now().toString(), // Simple unique ID
      date: newEventDate.format('YYYY-MM-DD'), // Store as string
      title: newEventTitle.trim(),
      description: newEventDescription.trim() || null,
    }

    const currentEvents = calendar?.events ?? []
    const updatedCalendarState: CalendarState = {
      events: [...currentEvents, newEvent].sort((a, b) =>
        dayjs(a.date).diff(dayjs(b.date))
      ), // Sort events by date
    }

    try {
      await setCalendar(updatedCalendarState)
      // Reset form
      setNewEventDate(dayjs())
      setNewEventTitle('')
      setNewEventDescription('')
      alert('Event added successfully!')
    } catch (error) {
      console.error('Failed to save calendar:', error)
      alert('Failed to add event. Check console for details.')
    }
  }

  const isDisabled = isLoading // Disable form while loading

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box
        sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}
      >
        {/* StaticDatePicker */}
        <Paper elevation={1} sx={{ mb: 2, overflow: 'hidden' }}>
          <StaticDatePicker
            orientation="portrait"
            openTo="day"
            value={selectedDate}
            onChange={(newValue) => setSelectedDate(newValue)}
            disabled={isDisabled}
          />
        </Paper>

        {/* Display Events for Selected Date */}
        {isLoading ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading events...
          </Typography>
        ) : (
          renderEvents(selectedDate, eventsForSelectedDate)
        )}

        <Divider sx={{ width: '80%', my: 2 }} />

        {/* Add Event Form */}
        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault()
            handleAddEvent()
          }}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '90%' }}
        >
          <DatePicker
            label="Event Date"
            value={newEventDate}
            onChange={(newValue) => setNewEventDate(newValue)}
            disabled={isDisabled}
            sx={{ width: '100%' }}
          />
          <TextField
            label="Event Title"
            variant="outlined"
            size="small"
            fullWidth
            required
            value={newEventTitle}
            onChange={(e) => setNewEventTitle(e.target.value)}
            disabled={isDisabled}
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
            disabled={isDisabled}
          />
          <Button type="submit" variant="contained" disabled={isDisabled}>
            {isLoading ? 'Loading...' : 'Add Event'}
          </Button>
        </Box>
      </Box>
    </LocalizationProvider>
  )
}
