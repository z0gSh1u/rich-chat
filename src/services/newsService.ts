import { fetch } from '@tauri-apps/plugin-http'

// Interfaces specific to WallstreetCN
export interface WallstreetNewsItem {
  id: number
  title: string
  uri: string
  content_short: string
  display_time: number // Unix timestamp
}

interface WallstreetLiveData {
  items: WallstreetNewsItem[]
  next_cursor: string
}

interface WallstreetNewsData {
  items: WallstreetNewsItem[]
  next_cursor: string
}

// Type for the expected structure within the API's "data" field
interface WallstreetApiDataField {
  items: WallstreetNewsItem[]
  next_cursor: string
}

// Type for the expected overall JSON response body structure
interface WallstreetApiResponse {
  data: WallstreetApiDataField
  // Add other potential top-level fields if known (e.g., code, message)
  code?: number
  message?: string
}

// Function to fetch news from WallstreetCN
export const fetchWallstreetNews = async (): Promise<WallstreetNewsItem[]> => {
  const url = 'https://api-one.wallstcn.com/apiv1/content/lives?limit=20'
  try {
    const response = await fetch(url, {
      method: 'GET',
      // No responseType needed here; we'll parse manually
    })

    console.log('Raw WallstreetCN Response Status:', response.status)

    if (response.ok) {
      // Await the JSON parsing
      const responseBody = (await response.json()) as WallstreetApiResponse
      console.log('Parsed WallstreetCN Response Body:', responseBody)

      if (responseBody?.data?.items && Array.isArray(responseBody.data.items)) {
        console.log('Fetched WallstreetCN news:', responseBody.data.items)
        return responseBody.data.items
      } else {
        console.error('Response Data Structure Issue. Received body:', responseBody)
      }
    } else {
      // Log detailed error if response is not ok
      console.error('Failed to fetch WallstreetCN news. Status:', response.status)
      // Attempt to read response body as text for error logging
      try {
        const errorBody = await response.text()
        console.error('Response Error Body:', errorBody)
      } catch (textError) {
        console.error('Could not read error response body as text.')
      }
    }

    return [] // Return empty array on any failure path
  } catch (error) {
    console.error('Error during fetchWallstreetNews execution:', error)
    return [] // Return empty array on exception
  }
}

// --- Xueqiu Interfaces ---

interface XueqiuStockItemRaw {
  code: string
  name: string
  percent: number
  exchange: string
  ad: number // Used for filtering
}

interface XueqiuStockResponseData {
  items: XueqiuStockItemRaw[]
  // Other potential fields in data
}

interface XueqiuStockApiResponse {
  data: XueqiuStockResponseData
  error_code?: number
  error_description?: string
}

// Interface for the data structure returned by the service function
export interface XueqiuStockItem {
  code: string // Use code as ID
  name: string
  percent: number
  exchange: string
  url: string
}

// --- Xueqiu Fetch Function ---

export const fetchXueqiuHotStocks = async (): Promise<XueqiuStockItem[]> => {
  const cookieUrl = 'https://xueqiu.com/hq'
  const dataUrl =
    'https://stock.xueqiu.com/v5/stock/hot_stock/list.json?size=30&_type=10&type=10'

  try {
    // Step 1: Fetch the cookie
    console.log('Fetching Xueqiu cookie...')
    const cookieResponse = await fetch(cookieUrl, { method: 'GET' })
    if (!cookieResponse.ok) {
      console.error('Failed to fetch Xueqiu cookie. Status:', cookieResponse.status)
      return []
    }
    // Note: Tauri's fetch response doesn't directly expose raw headers like Set-Cookie easily.
    // For many sites needing cookies, this might require more advanced handling or
    // potentially backend assistance if the cookie isn't automatically managed by the fetch client.
    // However, let's proceed assuming the underlying client *might* handle session cookies.
    // If it fails, this is the likely point of failure.
    console.log('Cookie fetch attempt completed. Status:', cookieResponse.status)

    // Step 2: Fetch the hot stock data (hopefully with cookie handled implicitly)
    console.log('Fetching Xueqiu hot stocks...')
    const dataResponse = await fetch(dataUrl, {
      method: 'GET',
      // We cannot manually set the cookie easily here with Tauri's fetch
      // headers: { 'cookie': '...' } // This is tricky/often doesn't work as expected
    })

    console.log('Xueqiu Data Response Status:', dataResponse.status)

    if (dataResponse.ok) {
      const responseBody = (await dataResponse.json()) as XueqiuStockApiResponse
      console.log('Parsed Xueqiu Response Body:', responseBody)

      if (responseBody?.data?.items) {
        const filteredItems = responseBody.data.items.filter((k) => !k.ad)
        const mappedItems: XueqiuStockItem[] = filteredItems.map((k) => ({
          code: k.code,
          name: k.name,
          percent: k.percent,
          exchange: k.exchange,
          url: `https://xueqiu.com/s/${k.code}`,
        }))
        console.log('Fetched Xueqiu hot stocks:', mappedItems)
        return mappedItems
      } else {
        console.error('Xueqiu Response Data Structure Issue:', responseBody)
      }
    } else {
      console.error('Failed to fetch Xueqiu hot stocks. Status:', dataResponse.status)
      try {
        const errorBody = await dataResponse.text()
        console.error('Xueqiu Response Error Body:', errorBody)
      } catch (textError) {
        console.error('Could not read Xueqiu error response body as text.')
      }
    }

    return []
  } catch (error) {
    console.error('Error during fetchXueqiuHotStocks execution:', error)
    return []
  }
}

// --- Weibo Interfaces ---

interface WeiboRealtimeItemRaw {
  num: number // ID?
  emoticon: string
  icon?: string // URL for 热/新 icons
  icon_width: number
  icon_height: number
  is_ad?: number // 1 if ad
  note: string
  small_icon_desc: string
  icon_desc?: string // e.g., '荐' for ads
  topic_flag: number
  icon_desc_color: string
  flag: number
  word_scheme: string // Sometimes includes #...# or links
  small_icon_desc_color: string
  realpos: number
  label_name: string
  word: string // The hot search term
  rank: number
}

interface WeiboResponseData {
  realtime: WeiboRealtimeItemRaw[]
  // Other potential fields in data
}

interface WeiboApiResponse {
  ok: number // 1 if successful
  data: WeiboResponseData
  message?: string // Optional error message
}

// Interface for the data structure returned by the service function
export interface WeiboHotSearchItem {
  id: string // Use word as ID
  title: string
  url: string
  rank: number
  // mobileUrl: string; // Can include if needed
}

// --- Weibo Fetch Function ---

export const fetchWeiboHotSearch = async (): Promise<WeiboHotSearchItem[]> => {
  const url = 'https://weibo.com/ajax/side/hotSearch'
  try {
    console.log('Fetching Weibo hot search...')
    const response = await fetch(url, {
      method: 'GET',
      // Weibo might require specific headers (User-Agent, Referer, Cookie)
      // If this fails, inspect network requests in a browser
      // and potentially add headers here or use a backend command.
    })

    console.log('Weibo Hot Search Response Status:', response.status)

    if (response.ok) {
      const responseBody = (await response.json()) as WeiboApiResponse
      console.log('Parsed Weibo Response Body:', responseBody)

      if (responseBody.ok === 1 && responseBody.data?.realtime) {
        const filteredItems = responseBody.data.realtime.filter((k) => !k.is_ad)
        const mappedItems: WeiboHotSearchItem[] = filteredItems.map((k) => {
          // Prefer word_scheme if it exists, otherwise construct search term
          const keyword = k.word_scheme || `#${k.word}#`
          return {
            id: k.word, // Use the word itself as a unique ID for this list
            title: k.word,
            url: `https://s.weibo.com/weibo?q=${encodeURIComponent(keyword)}`,
            rank: k.rank,
          }
        })
        console.log('Fetched Weibo hot search:', mappedItems)
        return mappedItems
      } else {
        console.error('Weibo Response Data Structure Issue or ok!=1:', responseBody)
      }
    } else {
      console.error('Failed to fetch Weibo hot search. Status:', response.status)
      try {
        const errorBody = await response.text()
        console.error('Weibo Response Error Body:', errorBody)
      } catch (textError) {
        console.error('Could not read Weibo error response body as text.')
      }
    }

    return []
  } catch (error) {
    console.error('Error during fetchWeiboHotSearch execution:', error)
    return []
  }
}
