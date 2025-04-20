import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { open } from '@tauri-apps/plugin-shell'
import {
  fetchXueqiuHotStocks,
  type XueqiuStockItem,
  fetchWeiboHotSearch,
  type WeiboHotSearchItem,
  fetchCailiansheHot,
  type CailiansheHotItem,
  fetchWallstreetcnHot,
  type WallstreetcnHotItem,
} from '../services'
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Link,
  CircularProgress,
  Alert,
  Chip,
  Tabs,
  Tab,
} from '@mui/material'

// Unified news item structure used for rendering lists
interface NewsItem {
  id: string | number
  source: string
  title: string
  url: string
  timestamp: number // Unix timestamp (seconds) for sorting/display
  content?: string // Optional content/description
}

// Helper component for Tab Panels (standard MUI pattern)
interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`news-tabpanel-${index}`}
      aria-labelledby={`news-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  )
}

// Helper to generate accessibility props for tabs
function a11yProps(index: number) {
  return {
    id: `news-tab-${index}`,
    'aria-controls': `news-tabpanel-${index}`,
  }
}

// Reusable News List Component
interface NewsListProps {
  items: NewsItem[]
  getSourceChipColor: (source: string) => string
  handleLinkClick: (url: string) => void
}

const NewsList: React.FC<NewsListProps> = ({
  items,
  getSourceChipColor,
  handleLinkClick,
}) => {
  const { t } = useTranslation()

  if (items.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
        {t('newsPanel.noNews')}
      </Typography>
    )
  }

  return (
    <List
      dense
      sx={{
        maxHeight: 480, // Set maximum height
        overflowY: 'auto', // Enable vertical scroll on overflow
        pr: 1, // Add some padding to the right to prevent scrollbar overlap
      }}
    >
      {items.map((item) => (
        <ListItem key={`${item.source}-${item.id}`} disableGutters>
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={item.source}
                  size="small"
                  sx={{
                    backgroundColor: getSourceChipColor(item.source),
                    color: 'white',
                    fontSize: '0.7rem',
                    height: 'auto',
                    '& .MuiChip-label': {
                      padding: '1px 4px',
                    },
                  }}
                />
                <Link
                  component="button"
                  variant="body1"
                  onClick={() => handleLinkClick(item.url)}
                  sx={{ textAlign: 'left', cursor: 'pointer' }}
                >
                  {item.title}
                </Link>
              </Box>
            }
            secondary={`${new Date(
              item.timestamp * 1000 // Multiply by 1000 for JS Date
            ).toLocaleString()} ${item.content ? `- ${item.content}` : ''}`}
            secondaryTypographyProps={{
              variant: 'body2',
              color: 'text.secondary',
            }}
          />
        </ListItem>
      ))}
    </List>
  )
}

const NewsPanel: React.FC = () => {
  const { t } = useTranslation()

  // Separate state for each news source
  const [wallstreetItems, setWallstreetItems] = useState<NewsItem[]>([])
  const [xueqiuItems, setXueqiuItems] = useState<NewsItem[]>([])
  const [weiboItems, setWeiboItems] = useState<NewsItem[]>([])
  const [cailiansheItems, setCailiansheItems] = useState<NewsItem[]>([])
  const [wscnHotItems, setWscnHotItems] = useState<NewsItem[]>([])

  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState(0) // State for active tab index

  useEffect(() => {
    const loadNews = async () => {
      setLoading(true)
      setError(null)
      // Reset states before fetching
      setWallstreetItems([])
      setXueqiuItems([])
      setWeiboItems([])
      setCailiansheItems([])
      setWscnHotItems([])

      const fetchTimestamp = Math.floor(Date.now() / 1000)

      try {
        const results = await Promise.allSettled([
          fetchWallstreetcnHot(),
          fetchXueqiuHotStocks(),
          fetchWeiboHotSearch(),
          fetchCailiansheHot(),
        ])

        let fetchErrors: string[] = []

        // Process Wallstreetcn Hot results (index 0)
        if (results[0].status === 'fulfilled') {
          const wscnHot = results[0].value as WallstreetcnHotItem[]
          const transformedWscnHot: NewsItem[] = wscnHot.map((item) => ({
            id: item.id,
            source: 'WscnHot',
            title: item.title,
            url: item.url,
            timestamp: fetchTimestamp,
            content: '',
          }))
          setWscnHotItems(transformedWscnHot)
        } else {
          console.error('Error fetching Wallstreetcn Hot:', results[0].reason)
          fetchErrors.push('WscnHot')
        }

        // Process Xueqiu results (index 1)
        if (results[1].status === 'fulfilled') {
          const xqStocks = results[1].value as XueqiuStockItem[]
          const transformedXqStocks: NewsItem[] = xqStocks.map((item) => ({
            id: item.code,
            source: 'Xueqiu',
            title: item.name,
            url: item.url,
            timestamp: fetchTimestamp, // Use fetch time as timestamp
            content: `${item.percent > 0 ? '+' : ''}${item.percent}% (${
              item.exchange
            })`,
          }))
          setXueqiuItems(transformedXqStocks)
        } else {
          console.error('Error fetching Xueqiu:', results[1].reason)
          fetchErrors.push('Xueqiu')
        }

        // Process Weibo results (index 2)
        if (results[2].status === 'fulfilled') {
          const wbHot = results[2].value as WeiboHotSearchItem[]
          const transformedWbHot: NewsItem[] = wbHot.map((item) => ({
            id: item.id,
            source: 'Weibo',
            title: item.title,
            url: item.url,
            timestamp: fetchTimestamp, // Use fetch time as timestamp
            content: `${t('newsPanel.rank')}${item.rank}`,
          }))
          setWeiboItems(transformedWbHot)
        } else {
          console.error('Error fetching Weibo:', results[2].reason)
          fetchErrors.push('Weibo')
        }

        // Process Cailianshe results (index 3)
        if (results[3].status === 'fulfilled') {
          const clsHot = results[3].value as CailiansheHotItem[]
          const transformedClsHot: NewsItem[] = clsHot.map((item) => ({
            id: item.id,
            source: 'Cailianshe',
            title: item.title,
            url: item.url,
            timestamp: fetchTimestamp, // Use fetch time
            content: '', // No extra content
          }))
          setCailiansheItems(transformedClsHot)
        } else {
          console.error('Error fetching Cailianshe:', results[3].reason)
          fetchErrors.push('Cailianshe')
        }

        // Set error message if any fetch failed
        if (fetchErrors.length > 0) {
          setError(
            t('newsPanel.failedToLoad', {
              sources: fetchErrors.join(', '),
            })
          )
        }
      } catch (err: any) {
        console.error('Critical error loading news data:', err)
        setError(t('newsPanel.unexpectedError'))
        // Ensure states are empty on critical error
        setWallstreetItems([])
        setXueqiuItems([])
        setWeiboItems([])
        setCailiansheItems([])
        setWscnHotItems([])
      } finally {
        setLoading(false)
      }
    }

    loadNews()
  }, [t])

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  const handleLinkClick = async (url: string) => {
    try {
      await open(url)
    } catch (err) {
      console.error('Failed to open link:', err)
    }
  }

  const getSourceChipColor = (source: string): string => {
    switch (source.toLowerCase()) {
      case 'wallstreetcn':
        return '#f57c00' // Orange
      case 'xueqiu':
        return '#1e88e5' // Blue
      case 'weibo':
        return '#e91e63' // Pink/Red
      case 'cailianshe':
        return '#d32f2f' // Red
      case 'wscnhot':
        return '#ff6f00' // Amber/Dark Orange
      default:
        return '#757575' // Grey
    }
  }

  return (
    <Box sx={{ width: '100%', p: 0 }}>
      {/* Tabs Header */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="News sources tabs"
          variant="fullWidth" // Make tabs take full width
        >
          <Tab label={t('newsPanel.tabWallstreetcn')} {...a11yProps(0)} />
          <Tab label={t('newsPanel.tabXueqiu')} {...a11yProps(1)} />
          <Tab label={t('newsPanel.tabWeibo')} {...a11yProps(2)} />
          <Tab label={t('newsPanel.tabCailianshe')} {...a11yProps(3)} />
        </Tabs>
      </Box>
      {/* Loading Indicator - Centered below tabs */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}
      {/* Error Alert - Shown below tabs if there was an error */}
      {error && !loading && (
        <Box sx={{ p: 2 }}>
          {' '}
          {/* Add padding for alert */}
          <Alert severity="warning" sx={{ mb: 1 }}>
            {error} {t('newsPanel.dataMissing')}
          </Alert>
        </Box>
      )}
      {/* Tab Panels - Render content only when not loading */}
      {!loading && (
        <>
          <TabPanel value={activeTab} index={0}>
            <NewsList
              items={wscnHotItems}
              getSourceChipColor={getSourceChipColor}
              handleLinkClick={handleLinkClick}
            />
          </TabPanel>
          <TabPanel value={activeTab} index={1}>
            <NewsList
              items={xueqiuItems}
              getSourceChipColor={getSourceChipColor}
              handleLinkClick={handleLinkClick}
            />
          </TabPanel>
          <TabPanel value={activeTab} index={2}>
            <NewsList
              items={weiboItems}
              getSourceChipColor={getSourceChipColor}
              handleLinkClick={handleLinkClick}
            />
          </TabPanel>
          <TabPanel value={activeTab} index={3}>
            <NewsList
              items={cailiansheItems}
              getSourceChipColor={getSourceChipColor}
              handleLinkClick={handleLinkClick}
            />
          </TabPanel>
        </>
      )}
    </Box>
  )
}

export default NewsPanel
