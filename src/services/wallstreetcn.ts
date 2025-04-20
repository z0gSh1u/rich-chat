import { fetch } from '@tauri-apps/plugin-http'

// --- Wallstreetcn Hot Interfaces ---

// Raw item structure from the API
interface WallstreetcnHotItemRaw {
  uri: string
  id: number
  title: string // Seems mandatory based on mapping code
  // Other fields from original Item like content_text, display_time exist but aren't used for hot list
}

// Structure of the API response data field
interface WallstreetcnHotResponseData {
  day_items: WallstreetcnHotItemRaw[]
}

// Overall API response structure
interface WallstreetcnHotApiResponse {
  data: WallstreetcnHotResponseData
  // Other potential fields like code, message
}

// Define the structure returned by the service function
export interface WallstreetcnHotItem {
  id: number
  title: string
  url: string
}

// --- Wallstreetcn Hot Fetch Function ---

export const fetchWallstreetcnHot = async (): Promise<WallstreetcnHotItem[]> => {
  const url = 'https://api-one.wallstcn.com/apiv1/content/articles/hot?period=all'
  try {
    console.log('Fetching Wallstreetcn hot...')
    const response = await fetch(url, {
      method: 'GET',
    })

    console.log('Wallstreetcn Hot Response Status:', response.status)

    if (response.ok) {
      const responseBody = (await response.json()) as WallstreetcnHotApiResponse
      console.log('Parsed Wallstreetcn Hot Response Body:', responseBody)

      if (responseBody?.data?.day_items && Array.isArray(responseBody.data.day_items)) {
        const mappedItems: WallstreetcnHotItem[] = responseBody.data.day_items.map(
          (k) => ({
            id: k.id,
            title: k.title, // Title seems guaranteed based on source code
            url: k.uri,
          })
        )
        console.log('Fetched Wallstreetcn hot:', mappedItems)
        return mappedItems
      } else {
        console.error('Wallstreetcn Hot Response Data Structure Issue:', responseBody)
        return []
      }
    } else {
      console.error('Failed to fetch Wallstreetcn hot. Status:', response.status)
      try {
        const errorBody = await response.text()
        console.error('Wallstreetcn Hot Response Error Body:', errorBody)
      } catch (textError) {
        console.error('Could not read Wallstreetcn Hot error response body as text.')
      }
      return []
    }
  } catch (error) {
    console.error('Error during fetchWallstreetcnHot execution:', error)
    return []
  }
}
