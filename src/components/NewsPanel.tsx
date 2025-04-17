import React, { useState, useEffect } from 'react'
import { open } from '@tauri-apps/plugin-shell'
import {
  fetchWallstreetNews,
  WallstreetNewsItem,
  fetchXueqiuHotStocks,
  XueqiuStockItem,
  fetchWeiboHotSearch,
  WeiboHotSearchItem,
} from '../services/newsService'
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
} from '@mui/material'

// Unified news item structure used in the component
interface NewsItem {
  id: string | number
  source: string
  title: string
  url: string
  timestamp: number // Unix timestamp (seconds) for sorting
  content?: string // Optional content/description
}

const NewsPanel: React.FC = () => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadNews = async () => {
      setLoading(true)
      setError(null)
      const fetchTimestamp = Math.floor(Date.now() / 1000) // Use fetch time as timestamp for sources lacking it

      try {
        // Fetch from all sources concurrently
        const results = await Promise.allSettled([
          fetchWallstreetNews(),
          fetchXueqiuHotStocks(),
          fetchWeiboHotSearch(), // Add Weibo fetch
        ])

        let combinedNews: NewsItem[] = []
        let fetchErrors: string[] = []

        // Process WallstreetCN results (index 0)
        if (results[0].status === 'fulfilled') {
          const wsNews = results[0].value as WallstreetNewsItem[]
          const transformedWsNews: NewsItem[] = wsNews.map((item) => ({
            id: item.id,
            source: 'WallstreetCN',
            title: item.title,
            url: item.uri,
            timestamp: item.display_time, // Use item's own timestamp
            content: item.content_short,
          }))
          combinedNews = combinedNews.concat(transformedWsNews)
        } else {
          console.error('Error fetching WallstreetCN:', results[0].reason)
          fetchErrors.push('WallstreetCN')
        }

        // Process Xueqiu results (index 1)
        if (results[1].status === 'fulfilled') {
          const xqStocks = results[1].value as XueqiuStockItem[]
          const transformedXqStocks: NewsItem[] = xqStocks.map((item) => ({
            id: item.code,
            source: 'Xueqiu',
            title: item.name,
            url: item.url,
            timestamp: fetchTimestamp, // Use fetch time
            content: `${item.percent > 0 ? '+' : ''}${item.percent}% (${
              item.exchange
            })`,
          }))
          combinedNews = combinedNews.concat(transformedXqStocks)
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
            timestamp: fetchTimestamp, // Use fetch time
            content: `Rank: ${item.rank}`, // Show rank as content
          }))
          combinedNews = combinedNews.concat(transformedWbHot)
        } else {
          console.error('Error fetching Weibo:', results[2].reason)
          fetchErrors.push('Weibo')
        }

        // Sort all news by timestamp (newest first)
        combinedNews.sort((a, b) => b.timestamp - a.timestamp)

        setNewsItems(combinedNews)

        // Set error state if any fetch failed
        if (fetchErrors.length > 0) {
          setError(`Failed to load: ${fetchErrors.join(', ')}.`)
        }
      } catch (err: any) {
        // Catch unexpected errors during Promise.all or processing
        console.error('Critical error loading news data:', err)
        setError('An unexpected error occurred while loading news.')
        setNewsItems([]) // Clear items on critical error
      } finally {
        setLoading(false)
      }
    }

    loadNews()
  }, [])

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
      default:
        return '#757575' // Grey
    }
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        实时资讯
      </Typography>
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress />
        </Box>
      )}
      {/* Show error alert, but still show potentially partial data */}
      {error && (
        <Alert severity="warning" sx={{ my: 1 }}>
          {error} (some data might be missing)
        </Alert>
      )}
      {!loading && (
        <List dense>
          {newsItems.length > 0 ? (
            newsItems.map((item) => (
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
            ))
          ) : (
            // Show no data message only if loading is finished and there are truly no items
            <Typography variant="body2" color="text.secondary">
              暂无最新资讯。
            </Typography>
          )}
        </List>
      )}
    </Box>
  )
}

export default NewsPanel
