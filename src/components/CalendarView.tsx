'use client' // Required for react-day-picker interactions

import * as React from 'react'
import dayjs, { Dayjs } from 'dayjs'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'

export function CalendarView() {
  const [selectedDate, setSelectedDate] = React.useState<Dayjs | null>(dayjs())

  // Placeholder for fetching/displaying events for the selected date
  const renderEvents = (date: Dayjs | null) => {
    if (!date) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Select a date to see events.
        </Typography>
      )
    }
    // In a real app, fetch events for date.format('YYYY-MM-DD')
    const events = [
      { id: 1, title: 'Placeholder Event 1' },
      { id: 2, title: 'Placeholder Event 2' },
    ]

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Events for {date.format('YYYY-MM-DD')}:
        </Typography>
        {events.length > 0 ? (
          <List
            dense
            sx={{
              maxHeight: 150,
              overflow: 'auto',
              bgcolor: 'background.paper',
              borderRadius: 1,
            }}
          >
            {events.map((event) => (
              <ListItem key={event.id} disablePadding>
                <ListItemText
                  primary={event.title}
                  primaryTypographyProps={{ fontSize: '0.875rem' }}
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
            No events for this date.
          </Typography>
        )}
      </Box>
    )
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* StaticDatePicker displays the calendar inline */}
        {/* Paper adds a background consistent with the theme */}
        <Paper elevation={1} sx={{ mb: 2, overflow: 'hidden' }}>
          <StaticDatePicker
            orientation="portrait" // or "landscape"
            openTo="day"
            value={selectedDate}
            onChange={(newValue) => setSelectedDate(newValue)}
          />
        </Paper>
        {renderEvents(selectedDate)}
      </Box>
    </LocalizationProvider>
  )
}
