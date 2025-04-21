import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
// MUI Imports
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import Typography from '@mui/material/Typography'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore' // Corrected import path after install
import Box from '@mui/material/Box'
import Link from '@mui/material/Link'
import { open } from '@tauri-apps/plugin-shell'

// Import getVersion from tauri api
import { getVersion } from '@tauri-apps/api/app'

// Your component imports
import NewsPanel from './NewsPanel'
import { CalendarView } from './CalendarView'
import { PortfolioManager } from './PortfolioManager'
import { SystemConfig } from './SystemConfig'
import InvestmentStyleConfig from './InvestmentStyleConfig'

export function RightPanel() {
  const { t, i18n } = useTranslation()
  const [expanded, setExpanded] = React.useState<string | false>('panel0')
  const [appVersion, setAppVersion] = useState<string>('')
  const [todayDate, setTodayDate] = useState<string>('')

  const handleChange =
    (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false)
    }

  useEffect(() => {
    // Fetch the app version when the component mounts
    getVersion().then(setAppVersion)

    // Get and format today's date
    const today = new Date()
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
    // Use i18n.language for locale-aware date formatting
    setTodayDate(today.toLocaleDateString(i18n.language, options))
  }, [i18n.language]) // Add i18n.language to dependency array

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        p: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Accordion expanded={expanded === 'panel0'} onChange={handleChange('panel0')}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel0bh-content"
          id="panel0bh-header"
        >
          <Typography sx={{ width: 'auto', flexShrink: 0 }}>
            {t('rightPanel.newsToday')}
          </Typography>
          <Typography sx={{ color: 'text.secondary', marginLeft: 'auto' }}>
            {todayDate}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <NewsPanel />
        </AccordionDetails>
      </Accordion>

      <Accordion expanded={expanded === 'panel1'} onChange={handleChange('panel1')}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1bh-content"
          id="panel1bh-header"
        >
          <Typography sx={{ width: '33%', flexShrink: 0 }}>
            {t('rightPanel.eventCalendar')}
          </Typography>
          {/* Optional: Add secondary heading if needed */}
          {/* <Typography sx={{ color: 'text.secondary' }}>Event details</Typography> */}
        </AccordionSummary>
        <AccordionDetails>
          <CalendarView />
        </AccordionDetails>
      </Accordion>

      <Accordion expanded={expanded === 'panel2'} onChange={handleChange('panel2')}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel2bh-content"
          id="panel2bh-header"
        >
          <Typography sx={{ width: '33%', flexShrink: 0 }}>
            {t('rightPanel.portfolio')}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <PortfolioManager />
        </AccordionDetails>
      </Accordion>

      <Accordion expanded={expanded === 'panel3'} onChange={handleChange('panel3')}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel3bh-content"
          id="panel3bh-header"
        >
          <Typography sx={{ width: '33%', flexShrink: 0 }}>
            {t('rightPanel.investmentStyle')}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <InvestmentStyleConfig />
        </AccordionDetails>
      </Accordion>

      <Accordion expanded={expanded === 'panel4'} onChange={handleChange('panel4')}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel4bh-content"
          id="panel4bh-header"
        >
          <Typography sx={{ width: '33%', flexShrink: 0 }}>
            {t('rightPanel.configuration')}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <SystemConfig />
        </AccordionDetails>
      </Accordion>

      <Box
        sx={{
          marginTop: 'auto',
          p: 2,
          textAlign: 'center',
          display: 'flex',
          gap: 1,
          justifyContent: 'flex-end',
          alignItems: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          RichChat {t('rightPanel.by')} z0gSh1u
        </Typography>
        {appVersion && (
          <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
            v{appVersion}
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary">
          <Link
            onClick={async () => {
              try {
                await open('https://github.com/z0gSh1u/richchat')
              } catch (error) {
                console.error('Failed to open URL', error)
              }
            }}
            color="inherit"
            style={{ cursor: 'pointer' }}
          >
            {t('rightPanel.githubLink')}
          </Link>
        </Typography>
      </Box>
    </Box>
  )
}
