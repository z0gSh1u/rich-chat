import { fetch } from '@tauri-apps/plugin-http'
import CryptoJS from 'crypto-js'

// Default parameters required by the API
const defaultParams = {
  appName: 'CailianpressWeb',
  os: 'web',
  sv: '7.7.5',
}

// Helper for SHA-1 hashing using crypto-js
function calculateSha1(input: string): string {
  return CryptoJS.SHA1(input).toString(CryptoJS.enc.Hex)
}

// Helper for MD5 hashing using crypto-js
function calculateMd5(input: string): string {
  return CryptoJS.MD5(input).toString(CryptoJS.enc.Hex)
}

/**
 * Generates the required search parameters including the sign.
 * @param moreParams Optional additional parameters to include.
 * @returns URLSearchParams object ready to be appended to the URL.
 */
export async function getClsSearchParams(
  moreParams?: Record<string, string | number>
): Promise<URLSearchParams> {
  // Note: crypto-js functions are synchronous, so the overall function
  // doesn't strictly need to be async anymore unless other async operations
  // are added later. Keeping it async for potential future flexibility.
  const combinedParams: Record<string, string> = { ...defaultParams }
  if (moreParams) {
    for (const key in moreParams) {
      combinedParams[key] = String(moreParams[key])
    }
  }

  const searchParams = new URLSearchParams(combinedParams)
  searchParams.sort()

  const paramString = searchParams.toString()
  // Original logic required md5(sha1(paramString))
  const sha1Hash = calculateSha1(paramString)
  const sign = calculateMd5(sha1Hash)

  searchParams.append('sign', sign)
  return searchParams
}

// --- Cailianshe Hot Interfaces ---

// Raw item structure from the API
interface CailiansheHotItemRaw {
  id: number
  title?: string
  brief: string
  shareurl: string
}

// Structure of the API response for the hot list
interface CailiansheHotApiResponse {
  data: CailiansheHotItemRaw[]
}

// Define the structure returned by the service function
export interface CailiansheHotItem {
  id: number
  title: string
  url: string
}

// --- Cailianshe Hot Fetch Function ---

export const fetchCailiansheHot = async (): Promise<CailiansheHotItem[]> => {
  const baseUrl = 'https://www.cls.cn/v2/article/hot/list'
  try {
    // Get the required search parameters, including the sign
    const searchParams = await getClsSearchParams()
    const url = `${baseUrl}?${searchParams.toString()}`

    console.log('Fetching Cailianshe hot from:', url)
    const response = await fetch(url, {
      method: 'GET',
    })

    console.log('Cailianshe Hot Response Status:', response.status)

    if (response.ok) {
      const responseBody = (await response.json()) as CailiansheHotApiResponse
      console.log('Parsed Cailianshe Hot Response Body:', responseBody)

      if (responseBody?.data && Array.isArray(responseBody.data)) {
        const mappedItems: CailiansheHotItem[] = responseBody.data.map((k) => ({
          id: k.id,
          title: k.title || k.brief,
          url: `https://www.cls.cn/detail/${k.id}`,
        }))
        console.log('Fetched Cailianshe hot:', mappedItems)
        return mappedItems
      } else {
        console.error('Cailianshe Hot Response Data Structure Issue:', responseBody)
        return []
      }
    } else {
      console.error('Failed to fetch Cailianshe hot. Status:', response.status)
      try {
        const errorBody = await response.text()
        console.error('Cailianshe Hot Response Error Body:', errorBody)
      } catch (textError) {
        console.error('Could not read Cailianshe Hot error response body as text.')
      }
      return []
    }
  } catch (error) {
    console.error('Error during fetchCailiansheHot execution:', error)
    return []
  }
}
