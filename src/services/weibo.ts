import { fetch } from '@tauri-apps/plugin-http'

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
        return [] // Ensure return on structure issue
      }
    } else {
      console.error('Failed to fetch Weibo hot search. Status:', response.status)
      try {
        const errorBody = await response.text()
        console.error('Weibo Response Error Body:', errorBody)
      } catch (textError) {
        console.error('Could not read Weibo error response body as text.')
      }
      return [] // Ensure return on non-ok status
    }
  } catch (error) {
    console.error('Error during fetchWeiboHotSearch execution:', error)
    return [] // Return empty array on exception
  }
}
