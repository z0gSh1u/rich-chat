import React from 'react'
// MUI Imports
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import Typography from '@mui/material/Typography'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore' // Corrected import path after install
import Box from '@mui/material/Box'
import Link from '@mui/material/Link'

// Your component imports
import { NewsPanel } from './NewsPanel'
import { CalendarView } from './CalendarView'
import { PortfolioManager } from './PortfolioManager'
import { SystemConfig } from './SystemConfig'
import InvestmentStyleConfig from './InvestmentStyleConfig'

export function RightPanel() {
  const [expanded, setExpanded] = React.useState<string | false>('panel0')

  const handleChange =
    (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false)
    }

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
          <Typography sx={{ width: '33%', flexShrink: 0 }}>📰 News Today</Typography>
          {/* Optional: Add secondary heading if needed */}
          {/* <Typography sx={{ color: 'text.secondary' }}>Event details</Typography> */}
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
            📅 Event Calendar
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
          <Typography sx={{ width: '33%', flexShrink: 0 }}>💼 Portfolio</Typography>
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
            💡 Investment Style
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
          <Typography sx={{ width: '33%', flexShrink: 0 }}>⚙️ Configuration</Typography>
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
          gap: 2,
          justifyContent: 'flex-end',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          RichChat by z0gSh1u
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <Link
            href="https://github.com/z0gSh1u/richchat"
            target="_blank"
            rel="noopener noreferrer"
            color="inherit"
          >
            GitHub
          </Link>
        </Typography>
      </Box>
    </Box>
  )
}
