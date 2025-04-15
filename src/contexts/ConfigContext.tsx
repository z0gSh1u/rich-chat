import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react'
import { invoke } from '@tauri-apps/api/core'

// Define the shape of the config and the context
interface AppConfig {
  api_key: string | null
}

interface ConfigContextType {
  apiKey: string | null
  setApiKey: (key: string | null) => Promise<void> // Make setApiKey async to handle invoke
  isLoading: boolean // Add loading state
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
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Load config on initial mount
  useEffect(() => {
    setIsLoading(true)
    invoke<AppConfig>('load_config')
      .then((config) => {
        console.log('Loaded config:', config)
        setApiKeyInternal(config.api_key)
      })
      .catch((err) => {
        console.error('Failed to load config:', err)
        // Handle error appropriately, maybe set a default or show a message
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  // Function to update API key and save config
  const setApiKey = async (key: string | null) => {
    setApiKeyInternal(key)
    try {
      const configToSave: AppConfig = { api_key: key }
      await invoke('save_config', { config: configToSave })
      console.log('Config saved successfully')
    } catch (err) {
      console.error('Failed to save config:', err)
      // Optionally handle save errors, e.g., revert state or show message
    }
  }

  const value = {
    apiKey,
    setApiKey,
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
