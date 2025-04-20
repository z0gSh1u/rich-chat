import { fetch } from '@tauri-apps/plugin-http'

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

    if (dataResponse.status === 200) {
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
