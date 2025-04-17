import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react'
import { invoke } from '@tauri-apps/api/core'

// --- Data Structures (Mirroring Rust) ---

export interface Holding {
  id: string
  type: string
  name: string
  amount: number
}

export interface PortfolioState {
  holdings: Holding[]
}

export interface InvestmentStyleItem {
  id: string
  description: string
}

export interface InvestmentStyleState {
  items: InvestmentStyleItem[]
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
  const setApiKey = async (key: string | null): Promise<void> => {
    const previousValue = apiKey
    setApiKeyInternal(key)
    const configToSave: AppConfig = {
      api_key: key,
      endpoint_url: endpointUrl,
      portfolio: portfolio,
      investment_style: investmentStyle,
      calendar: calendar,
    }
    try {
      await saveConfig(configToSave)
    } catch (error) {
      console.error('Error saving API key, reverting UI.', error)
      setApiKeyInternal(previousValue)
    }
  }

  // Function to update Endpoint URL and save config
  const setEndpointUrl = async (url: string | null): Promise<void> => {
    const previousValue = endpointUrl
    setEndpointUrlInternal(url)
    const configToSave: AppConfig = {
      api_key: apiKey,
      endpoint_url: url,
      portfolio: portfolio,
      investment_style: investmentStyle,
      calendar: calendar,
    }
    try {
      await saveConfig(configToSave)
    } catch (error) {
      console.error('Error saving Endpoint URL, reverting UI.', error)
      setEndpointUrlInternal(previousValue)
    }
  }

  const setPortfolio = async (newPortfolio: PortfolioState | null): Promise<void> => {
    const previousValue = portfolio
    setPortfolioInternal(newPortfolio)
    const configToSave: AppConfig = {
      api_key: apiKey,
      endpoint_url: endpointUrl,
      portfolio: newPortfolio,
      investment_style: investmentStyle,
      calendar: calendar,
    }
    try {
      await saveConfig(configToSave)
    } catch (error) {
      console.error('Error saving Portfolio, reverting UI.', error)
      setPortfolioInternal(previousValue)
    }
  }

  const setInvestmentStyle = async (
    newStyleState: InvestmentStyleState | null
  ): Promise<void> => {
    const previousValue = investmentStyle
    setInvestmentStyleInternal(newStyleState)
    const configToSave: AppConfig = {
      api_key: apiKey,
      endpoint_url: endpointUrl,
      portfolio: portfolio,
      investment_style: newStyleState,
      calendar: calendar,
    }
    try {
      await saveConfig(configToSave)
    } catch (error) {
      console.error('Error saving Investment Style, reverting UI.', error)
      setInvestmentStyleInternal(previousValue)
    }
  }

  const setCalendar = async (newCalendar: CalendarState | null): Promise<void> => {
    const previousValue = calendar
    setCalendarInternal(newCalendar)
    const configToSave: AppConfig = {
      api_key: apiKey,
      endpoint_url: endpointUrl,
      portfolio: portfolio,
      investment_style: investmentStyle,
      calendar: newCalendar,
    }
    try {
      await saveConfig(configToSave)
    } catch (error) {
      console.error('Error saving Calendar, reverting UI.', error)
      setCalendarInternal(previousValue)
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
