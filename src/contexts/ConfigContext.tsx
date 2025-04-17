import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react'
import { invoke } from '@tauri-apps/api/core'

// --- Data Structures (Mirroring Rust) ---

export interface Holding {
  ticker: string
  quantity: number
  purchase_price: number
}

export interface PortfolioState {
  holdings: Holding[]
}

export interface InvestmentStyleState {
  style_description: string | null
}

export interface CalendarEvent {
  id: string
  date: string
  title: string
  description?: string | null
}

export interface CalendarState {
  events: CalendarEvent[]
}

// --- App Config & Context Type ---

interface AppConfig {
  api_key: string | null
  endpoint_url: string | null
  portfolio: PortfolioState | null
  investment_style: InvestmentStyleState | null
  calendar: CalendarState | null
}

interface ConfigContextType {
  apiKey: string | null
  endpointUrl: string | null
  portfolio: PortfolioState | null
  investmentStyle: InvestmentStyleState | null
  calendar: CalendarState | null
  setApiKey: (key: string | null) => Promise<void>
  setEndpointUrl: (url: string | null) => Promise<void>
  setPortfolio: (portfolio: PortfolioState | null) => Promise<void>
  setInvestmentStyle: (style: InvestmentStyleState | null) => Promise<void>
  setCalendar: (calendar: CalendarState | null) => Promise<void>
  isLoading: boolean
}

// Create the context with a default value
const ConfigContext = createContext<ConfigContextType | undefined>(undefined)

// Define the props for the provider
interface ConfigProviderProps {
  children: ReactNode
}

// Create the provider component
export const ConfigProvider: React.FC<ConfigProviderProps> = ({ children }) => {
  const [apiKey, setApiKeyInternal] = useState<string | null>(null)
  const [endpointUrl, setEndpointUrlInternal] = useState<string | null>(null)
  const [portfolio, setPortfolioInternal] = useState<PortfolioState | null>(null)
  const [investmentStyle, setInvestmentStyleInternal] =
    useState<InvestmentStyleState | null>(null)
  const [calendar, setCalendarInternal] = useState<CalendarState | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Function to load config (used by useEffect and setters)
  const loadConfig = async (): Promise<AppConfig | null> => {
    try {
      const config = await invoke<AppConfig>('load_config')
      console.log('Loaded config:', config)
      setApiKeyInternal(config.api_key)
      setEndpointUrlInternal(config.endpoint_url)
      setPortfolioInternal(config.portfolio)
      setInvestmentStyleInternal(config.investment_style)
      setCalendarInternal(config.calendar)
      return config
    } catch (err) {
      console.error('Failed to load config:', err)
      return null
    }
  }

  // Load config on initial mount
  useEffect(() => {
    setIsLoading(true)
    loadConfig().finally(() => {
      setIsLoading(false)
    })
  }, [])

  // Helper function to save the full config
  const saveConfig = async (config: AppConfig) => {
    try {
      await invoke('save_config', { config })
      console.log('Config saved successfully', config)
    } catch (err) {
      console.error('Failed to save config:', err)
      throw err
    }
  }

  // Function to update API key and save config
  const setApiKey = async (key: string | null) => {
    setApiKeyInternal(key)
    const currentConfig = await loadConfig()
    if (currentConfig) {
      await saveConfig({ ...currentConfig, api_key: key })
    } else {
      console.error('Cannot save API key: failed to load existing config.')
      setApiKeyInternal(apiKey)
    }
  }

  // Function to update Endpoint URL and save config
  const setEndpointUrl = async (url: string | null) => {
    setEndpointUrlInternal(url)
    const currentConfig = await loadConfig()
    if (currentConfig) {
      await saveConfig({ ...currentConfig, endpoint_url: url })
    } else {
      console.error('Cannot save Endpoint URL: failed to load existing config.')
      setEndpointUrlInternal(endpointUrl)
    }
  }

  const setPortfolio = async (newPortfolio: PortfolioState | null) => {
    setPortfolioInternal(newPortfolio)
    const currentConfig = await loadConfig()
    if (currentConfig) {
      await saveConfig({ ...currentConfig, portfolio: newPortfolio })
    } else {
      console.error('Cannot save Portfolio: failed to load existing config.')
      setPortfolioInternal(portfolio)
    }
  }

  const setInvestmentStyle = async (newStyle: InvestmentStyleState | null) => {
    setInvestmentStyleInternal(newStyle)
    const currentConfig = await loadConfig()
    if (currentConfig) {
      await saveConfig({ ...currentConfig, investment_style: newStyle })
    } else {
      console.error('Cannot save Investment Style: failed to load existing config.')
      setInvestmentStyleInternal(investmentStyle)
    }
  }

  const setCalendar = async (newCalendar: CalendarState | null) => {
    setCalendarInternal(newCalendar)
    const currentConfig = await loadConfig()
    if (currentConfig) {
      await saveConfig({ ...currentConfig, calendar: newCalendar })
    } else {
      console.error('Cannot save Calendar: failed to load existing config.')
      setCalendarInternal(calendar)
    }
  }

  const value = {
    apiKey,
    endpointUrl,
    portfolio,
    investmentStyle,
    calendar,
    setApiKey,
    setEndpointUrl,
    setPortfolio,
    setInvestmentStyle,
    setCalendar,
    isLoading,
  }

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
}

// Custom hook to use the ConfigContext
export const useConfig = (): ConfigContextType => {
  const context = useContext(ConfigContext)
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider')
  }
  return context
}
