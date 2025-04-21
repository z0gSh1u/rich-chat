import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next' // Import useTranslation
import './ChatPage.css' // We'll create this CSS file next
import { useConfig } from '../contexts/ConfigContext' // Import useConfig
import TextField from '@mui/material/TextField' // Import TextField
import Button from '@mui/material/Button' // Import Button for consistency
import Typography from '@mui/material/Typography' // Import Typography for loading indicator
import CircularProgress from '@mui/material/CircularProgress' // Import CircularProgress
import ReactMarkdown from 'react-markdown' // Import ReactMarkdown
import remarkGfm from 'remark-gfm' // Import remark-gfm for GFM support
import Box from '@mui/material/Box' // Import Box for layout
import CalendarTodayIcon from '@mui/icons-material/CalendarToday' // Import calendar icon
import Popover from '@mui/material/Popover' // Import Popover
import FormControlLabel from '@mui/material/FormControlLabel' // Import FormControlLabel
import Checkbox from '@mui/material/Checkbox' // Import Checkbox
import IconButton from '@mui/material/IconButton' // Import IconButton
import { useTheme } from '@mui/material/styles' // Import useTheme
import SettingsIcon from '@mui/icons-material/Settings' // Import Settings icon
// Import news fetching functions
import {
  fetchWallstreetcnHot,
  fetchXueqiuHotStocks,
  fetchWeiboHotSearch,
  fetchCailiansheHot,
} from '../services'
// Import the prompt builder utility
import { buildNewsSummaryPrompt } from '../utils/promptUtils'
import { buildInvestmentAdvicePrompt } from '../utils/promptUtils'
import {
  CalendarEvent,
  CalendarState,
  PortfolioState,
  InvestmentStyleState,
} from '../contexts/ConfigContext'
import { EventEditModal } from './EventEditModal' // Import the modal

interface Message {
  id: number
  text: string
  sender: 'user' | 'ai'
}

// Define the structure for OpenAI-compatible API messages
interface OpenAIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

// Interface for event details being edited
interface EditingEvent {
  id?: string // Optional, might not have one before saving
  title: string
  date: string // YYYY-MM-DD format
  description: string | null
}

const DEFAULT_DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'
const DEFAULT_MODEL = 'deepseek-chat' // Default model if none is configured

const ChatPage: React.FC = (): JSX.Element => {
  const { t } = useTranslation() // Initialize useTranslation
  const theme = useTheme() // Get the current theme
  const {
    apiKey,
    endpointUrl,
    model: configuredModel, // Get configured model
    isLoading: isConfigLoading,
    addCalendarEvent, // Get the new function from context
    portfolio, // Get portfolio state
    investmentStyle, // Get investment style state
    calendar, // Get calendar state
  } = useConfig()
  const [messages, setMessages] = useState<Message[]>([]) // Start with empty messages
  const [inputText, setInputText] = useState<string>('')
  const [isAiResponding, setIsAiResponding] = useState<boolean>(false)
  const [streamingMessageId, setStreamingMessageId] = useState<number | null>(null) // Track ID of message being streamed
  const messagesEndRef = useRef<null | HTMLDivElement>(null) // For scrolling
  const abortControllerRef = useRef<AbortController | null>(null) // Ref to hold AbortController
  const interruptRequestedRef = useRef<boolean>(false) // Ref flag for interruption
  const lastChunkWasReasoningRef = useRef<number | null>(null) // Ref to track if last chunk was reasoning
  const [promptOptions, setPromptOptions] = useState({
    includeDate: true,
    includeEvents: true,
    includePortfolio: true,
    includeStyle: true,
  })
  const [popoverAnchorEl, setPopoverAnchorEl] = useState<HTMLButtonElement | null>(null)

  // State for the Event Editing Modal
  const [isEventModalOpen, setIsEventModalOpen] = useState<boolean>(false)
  const [editingEvent, setEditingEvent] = useState<EditingEvent | null>(null)

  // Initial greeting or load previous chat if desired
  useEffect(() => {
    setMessages([
      {
        id: Date.now(),
        text: t('chat.initialGreeting'), // Translate greeting
        sender: 'ai',
      },
    ])
  }, [t]) // Add t to dependency array

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Function to actually send a prompt text to the LLM and update messages
  const sendMessageToLLM = async (promptText: string) => {
    // Use configured URL or default
    const apiUrl = endpointUrl || DEFAULT_DEEPSEEK_API_URL
    if (!apiKey) {
      // Already checked by callers, but good to have a safeguard
      console.error('API Key not configured')
      return
    }

    // Create and store abort controller
    abortControllerRef.current = new AbortController()

    setIsAiResponding(true)
    lastChunkWasReasoningRef.current = null // Reset ref before starting stream
    interruptRequestedRef.current = false // Ensure flag is reset before starting

    // Filter out initial AI greeting for API call if needed (esp. for reasoner)
    let messagesForApi = [...messages]
    if (
      messagesForApi.length > 0 &&
      messagesForApi[0].sender === 'ai'
      // Optional: Add check for configuredModel === 'deepseek-reasoner' if needed,
      // but filtering initial AI msg is generally safer for most models.
    ) {
      messagesForApi = messagesForApi.slice(1) // Remove the first AI message
    }

    // Format messages for the API, adding the current prompt as the last user message
    const systemPromptText = t('chat.systemPrompt') // Get translated prompt
    const apiMessages: OpenAIMessage[] = [
      { role: 'system', content: systemPromptText }, // Prepend the translated system prompt
      ...messagesForApi.map((msg) => ({
        role: msg.sender === 'user' ? ('user' as const) : ('assistant' as const),
        content: msg.text,
      })),
      { role: 'user', content: promptText }, // Add the current prompt here
    ]

    // --- Stream Handling Logic (copied from handleSendMessage) ---
    let streamReaderErrored = false
    const aiMessageId = Date.now() + 1 // Unique ID for the incoming AI message
    setStreamingMessageId(aiMessageId) // Set the ID of the message being streamed
    try {
      // Add placeholder for AI response first
      setMessages((prev) => [
        ...prev,
        { id: aiMessageId, text: '', sender: 'ai' }, // Start with empty text
      ])

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: configuredModel || DEFAULT_MODEL, // Use configured model or default
          messages: apiMessages,
          stream: true, // Enable streaming
          signal: abortControllerRef.current.signal, // Pass the signal to fetch
        }),
      })

      if (!response.ok) {
        let errorDetails = `HTTP error! status: ${response.status}`
        try {
          const errorJson = await response.json() // Try to parse error body
          errorDetails += `: ${errorJson.error?.message || JSON.stringify(errorJson)}`
        } catch (e) {
          /* Ignore if parsing error fails */
        }
        throw new Error(errorDetails)
      }

      if (!response.body) {
        throw new Error('Response body is null')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let done = false
      let accumulatedJson = '' // Buffer for potentially incomplete JSON chunks

      console.log('Starting stream reading loop...')
      while (!done) {
        // Check for user interruption before reading next chunk
        if (interruptRequestedRef.current) {
          console.log('Interruption requested, breaking read loop.')
          streamReaderErrored = true // Treat user interruption like an error for cleanup
          // Manually set an appropriate error message?
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.id === aiMessageId ? { ...msg, text: msg.text + ' [Stopped]' } : msg
            )
          )
          break
        }

        const { value, done: readerDone } = await reader.read()
        done = readerDone
        const chunk = decoder.decode(value, { stream: !done }) // Decode chunk

        accumulatedJson += chunk // Append chunk to buffer

        // Process line by line - SSE messages are newline-separated
        let newlineIndex
        while ((newlineIndex = accumulatedJson.indexOf('\n')) >= 0) {
          const line = accumulatedJson.substring(0, newlineIndex).trim()
          accumulatedJson = accumulatedJson.substring(newlineIndex + 1) // Remove processed line from buffer

          if (line.startsWith('data:')) {
            const jsonStr = line.substring(5).trim() // Get the JSON part
            if (jsonStr === '[DONE]') {
              done = true
              break
            }
            if (jsonStr) {
              try {
                const parsed = JSON.parse(jsonStr)

                // Process content and reasoning separately
                const contentChunk = parsed.choices?.[0]?.delta?.content ?? ''
                const reasoningChunk =
                  parsed.choices?.[0]?.delta?.reasoning_content ?? ''

                let updateText = ''
                let separator = ''

                if (reasoningChunk) {
                  // Append reasoning chunk, maybe format differently later if needed
                  updateText += reasoningChunk // Append raw reasoning for now
                  lastChunkWasReasoningRef.current = aiMessageId // Mark that last chunk for this ID was reasoning
                }
                if (contentChunk) {
                  // If the last chunk processed for *this message* was reasoning, add separator
                  if (lastChunkWasReasoningRef.current === aiMessageId) {
                    separator = '\n\n---\n\n' // Markdown HR with newlines
                    lastChunkWasReasoningRef.current = null // Reset flag as we are now processing content
                  }
                  // Append content chunk
                  updateText += separator + contentChunk
                }

                if (updateText) {
                  // Only update if there was content or reasoning
                  setMessages((prevMessages) =>
                    prevMessages.map((msg) =>
                      msg.id === aiMessageId
                        ? { ...msg, text: msg.text + updateText }
                        : msg
                    )
                  )
                }
              } catch (e) {
                console.error('Error parsing stream JSON:', jsonStr, e)
              }
            }
          }
        } // end while loop for lines
      } // end while loop for reader
    } catch (error) {
      console.log('Caught error in sendMessageToLLM:', error)
      console.error('Error processing stream:', error)
      streamReaderErrored = true
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === aiMessageId
            ? {
                ...msg,
                text: t('chat.errorFetchingResponse', {
                  errorMessage:
                    error instanceof DOMException && error.name === 'AbortError'
                      ? 'Request cancelled.'
                      : error instanceof Error
                      ? error.message
                      : String(error),
                }),
              }
            : msg
        )
      )
    } finally {
      if (!streamReaderErrored) {
        setIsAiResponding(false)
      }
      setIsAiResponding(false) // Ensure it's always set false eventually
      setStreamingMessageId(null) // Reset streaming ID when done or errored
      console.log('Executing finally block in sendMessageToLLM')
      abortControllerRef.current = null // Clear the ref
      interruptRequestedRef.current = false // Reset interruption flag
      lastChunkWasReasoningRef.current = null // Reset reasoning flag
    }
    // --- End Stream Handling Logic ---
  }

  const handleSendMessage = async () => {
    const trimmedInput = inputText.trim()
    if (trimmedInput === '' || isAiResponding || isConfigLoading) return // Prevent sending if empty, AI is busy, or config loading

    // Create a temporary user message for context, but don't display it
    const newUserMessage: Message = {
      id: Date.now(),
      text: trimmedInput, // Add the text back here
      sender: 'user',
    }

    // Add user message and clear input
    const updatedMessages = [...messages, newUserMessage]
    setMessages(updatedMessages)
    setInputText('')

    // Call the refactored function
    await sendMessageToLLM(trimmedInput)
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(event.target.value)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      // Send on Enter, allow Shift+Enter for newline
      event.preventDefault() // Prevent default Enter behavior (like newline in some inputs)
      handleSendMessage()
    }
  }

  // Function to start a new chat
  const handleNewChat = () => {
    if (window.confirm(t('chat.confirmNewChat'))) {
      // Reset messages to initial greeting
      setMessages([
        {
          id: Date.now(),
          text: t('chat.initialGreeting'),
          sender: 'ai',
        },
      ])
      // Clear the input field
      setInputText('')
      // Ensure AI is not marked as responding (in case it was stuck)
      setIsAiResponding(false)
      // TODO: Consider cancelling any ongoing fetch requests if needed
    }
  }

  // Function to fetch news, build prompt, and send to LLM
  const handleSummarizeNews = async () => {
    if (isAiResponding || isConfigLoading || !apiKey) {
      console.log('Cannot summarize: AI responding, config loading, or API key missing')
      return // Prevent triggering if busy or not configured
    }

    setIsAiResponding(true) // Indicate loading state

    let allHeadlines: string[] = []
    try {
      const results = await Promise.allSettled([
        fetchWallstreetcnHot(),
        fetchXueqiuHotStocks(),
        fetchWeiboHotSearch(),
        fetchCailiansheHot(),
      ])

      results.forEach((result) => {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
          // Construct headlines, handling Xueqiu specifically
          const headlines = result.value
            .map((item: any) => {
              if (item.code && item.name && item.percent && item.exchange) {
                // is Xueqiu
                return `${t('chat.stockUpAndDown')} ${item.name} (${item.percent} %)` // Combine name and percentage info
              } else {
                return item.title // Use title for other sources
              }
            })
            .filter(Boolean) // Filter out any null/empty results
          allHeadlines = allHeadlines.concat(headlines)
        }
      })

      if (allHeadlines.length === 0) {
        alert(t('chat.summarizeNoNews'))
        setIsAiResponding(false) // Reset loading state
        return
      }

      // Build the prompt using the utility function
      const fullPrompt = buildNewsSummaryPrompt(allHeadlines, t)

      // Add the constructed prompt as a user message to the chat history
      const promptUserMessage: Message = {
        id: Date.now(), // Use a timestamp for the ID
        text: fullPrompt,
        sender: 'user',
      }
      setMessages((prevMessages) => [...prevMessages, promptUserMessage])

      // Send the constructed prompt to the LLM
      await sendMessageToLLM(fullPrompt)
    } catch (error) {
      console.error('Error during news summarization fetch:', error)
      alert('Failed to fetch news for summarization.') // Generic error
      setIsAiResponding(false) // Reset loading state on error
    } finally {
      // The finally block in sendMessageToLLM handles resetting isAiResponding and streamingMessageId
    }
  }

  // Popover handlers
  const handlePopoverOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setPopoverAnchorEl(event.currentTarget)
  }

  const handlePopoverClose = () => {
    setPopoverAnchorEl(null)
  }

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPromptOptions({
      ...promptOptions,
      [event.target.name]: event.target.checked,
    })
  }

  const open = Boolean(popoverAnchorEl)
  const popoverId = open ? 'investment-options-popover' : undefined

  // Function to get investment advice
  const handleGetInvestmentAdvice = async () => {
    if (isAiResponding || isConfigLoading || !apiKey) {
      console.log(
        'Cannot get advice: AI responding, config loading, or API key missing'
      )
      return // Prevent triggering if busy or not configured
    }

    // Build the prompt using the utility function and current options
    const fullPrompt = buildInvestmentAdvicePrompt(
      t,
      promptOptions, // Pass the options state
      calendar,
      portfolio,
      investmentStyle
    )

    // Add the constructed prompt as a user message to the chat history
    const promptUserMessage: Message = {
      id: Date.now(), // Use a timestamp for the ID
      text: fullPrompt,
      sender: 'user',
    }
    setMessages((prevMessages) => [...prevMessages, promptUserMessage])

    // Send the constructed prompt to the LLM
    await sendMessageToLLM(fullPrompt)
  }

  // Function to interrupt the stream
  const handleInterrupt = () => {
    console.log('Attempting to interrupt stream...')
    interruptRequestedRef.current = true // Set the interruption flag
    if (abortControllerRef.current) {
      abortControllerRef.current.abort() // Signal cancellation
      // Let the fetch catch/finally block handle state/ref cleanup
    } else {
      console.log('No active AbortController found to interrupt.')
    }
  }

  // Placeholder: Function to handle closing the modal
  const handleCloseEventModal = () => {
    setIsEventModalOpen(false)
    setEditingEvent(null)
  }

  // Placeholder: Function to handle saving the event from the modal
  const handleSaveEvent = async (eventData: EditingEvent) => {
    if (!eventData.title) {
      alert(t('calendar.alertProvideTitle')) // Use existing translation
      return
    }
    try {
      console.log('Saving event:', eventData) // Log for debugging
      // TODO: Call addCalendarEvent with correct parameters (title, date, description)
      await addCalendarEvent(eventData.title, eventData.date, eventData.description)
      alert(t('chat.alertAddEventSuccess')) // Reuse existing success message
      handleCloseEventModal()
    } catch (error) {
      console.error('Failed to save event from modal:', error)
      alert(t('chat.alertAddEventFailed')) // Reuse existing fail message
    }
  }

  // Determine placeholder text
  const placeholderText = isConfigLoading
    ? t('chat.placeholderLoadingConfig')
    : isAiResponding
    ? t('chat.placeholderAiResponding')
    : t('chat.placeholderTypeMessage')

  // Determine button text
  const buttonText = isAiResponding ? t('chat.buttonThinking') : t('chat.buttonSend')

  // Determine if send should be disabled
  const sendDisabled =
    inputText.trim() === '' || isAiResponding || isConfigLoading || !apiKey

  return (
    <div className="chat-page">
      {/* Header for Buttons */}
      <div className="chat-header">
        <img src="/icon.png" alt="Logo" className="chat-logo" />
        <Box sx={{ flexGrow: 1 }} /> {/* Spacer pushes buttons to the right */}
        <Button
          variant="outlined"
          onClick={handleSummarizeNews}
          disabled={isAiResponding || isConfigLoading || !apiKey}
          sx={{
            borderRadius: '20px',
            whiteSpace: 'nowrap',
            mr: 1, // Keep margin right
            fontSize: '0.8rem', // Slightly smaller font for more buttons
          }}
        >
          {t('chat.buttonSummarizeNews')}
        </Button>
        <Button
          variant="outlined"
          onClick={handleGetInvestmentAdvice}
          disabled={isAiResponding || isConfigLoading || !apiKey}
          sx={{
            borderRadius: '20px 0 0 20px', // Left part of group
            whiteSpace: 'nowrap',
            fontSize: '0.8rem',
            borderRight: 'none', // Remove border between this and icon
            pl: 1.5,
            pr: 1,
          }}
        >
          {t('chat.buttonGetAdvice')}
        </Button>
        <IconButton
          size="small"
          aria-describedby={popoverId}
          onClick={handlePopoverOpen}
          disabled={isAiResponding || isConfigLoading || !apiKey}
          sx={{
            borderRadius: '0 20px 20px 0', // Right part of group
            border: `1px solid ${theme.palette.divider}`,
            borderLeft: 'none',
            ml: '-1px', // Overlap borders slightly
            mr: 1, // Add margin to separate from New Chat
            px: 0.5,
            fontSize: '1.2rem', // Icon size
          }}
        >
          <SettingsIcon fontSize="inherit" />
        </IconButton>
        <Popover
          id={popoverId}
          open={open}
          anchorEl={popoverAnchorEl}
          onClose={handlePopoverClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={promptOptions.includeDate}
                  onChange={handleCheckboxChange}
                  name="includeDate"
                  size="small"
                />
              }
              label={
                <Typography variant="body2">{t('chat.adviceOptionDate')}</Typography>
              }
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={promptOptions.includeEvents}
                  onChange={handleCheckboxChange}
                  name="includeEvents"
                  size="small"
                />
              }
              label={
                <Typography variant="body2">{t('chat.adviceOptionEvents')}</Typography>
              }
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={promptOptions.includePortfolio}
                  onChange={handleCheckboxChange}
                  name="includePortfolio"
                  size="small"
                />
              }
              label={
                <Typography variant="body2">
                  {t('chat.adviceOptionPortfolio')}
                </Typography>
              }
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={promptOptions.includeStyle}
                  onChange={handleCheckboxChange}
                  name="includeStyle"
                  size="small"
                />
              }
              label={
                <Typography variant="body2">{t('chat.adviceOptionStyle')}</Typography>
              }
            />
          </Box>
        </Popover>
        <Button
          variant="outlined"
          onClick={handleNewChat}
          disabled={isAiResponding}
          sx={{
            borderRadius: '20px',
            whiteSpace: 'nowrap',
            fontSize: '0.8rem',
          }}
        >
          {t('chat.buttonNewChat')}
        </Button>
      </div>

      <div className="message-list">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.sender}`}>
            {message.sender === 'user' ? (
              // Render user messages using ReactMarkdown
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>
            ) : (
              // Render AI messages with optional 'Add to Calendar' button
              <Box>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.text}
                </ReactMarkdown>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                  <Button
                    size="small"
                    variant="text" // Subtle button style
                    startIcon={<CalendarTodayIcon fontSize="inherit" />}
                    disabled={streamingMessageId === message.id} // Disable if this message is currently streaming
                    onClick={async () => {
                      // --- Updated Logic for Empty Title / Full Description ---
                      // 1. Set default title to empty and description to the full message
                      const defaultTitle = '' // Leave title empty by default
                      const defaultDescription = message.text.trim() // Use full message text for description

                      // 2. Get today's date
                      const today = new Date()
                        .toLocaleDateString('en-CA') // 'en-CA' gives YYYY-MM-DD
                        .split('T')[0]

                      // 3. Set state for modal
                      setEditingEvent({
                        title: defaultTitle,
                        description: defaultDescription,
                        date: today,
                      })
                      setIsEventModalOpen(true)
                    }}
                    sx={{
                      textTransform: 'none', // Prevent uppercase
                      color: 'text.secondary',
                      p: '2px 8px', // Adjust padding
                    }}
                  >
                    {t('chat.buttonAddEvent')}
                  </Button>
                </Box>
              </Box>
            )}
          </div>
        ))}
        {/* Element to scroll to */}
        <div ref={messagesEndRef} />
      </div>
      <div className="input-area">
        {/* Show loading indicator next to input area when AI is responding */}
        {isAiResponding && (
          <>
            <CircularProgress size={20} sx={{ mr: 1, alignSelf: 'center' }} />
            <Button
              size="small"
              variant="outlined"
              onClick={handleInterrupt}
              sx={{
                mr: 1,
                alignSelf: 'center',
                borderRadius: '20px',
                minWidth: 'auto',
                whiteSpace: 'nowrap',
              }}
            >
              {t('chat.buttonStopGenerating')}
            </Button>
          </>
        )}
        <TextField
          disabled={isAiResponding} // Also disable input when AI is responding
          fullWidth
          variant="outlined"
          size="small"
          value={inputText}
          onChange={handleInputChange} // Works with TextField too
          onKeyDown={handleKeyDown} // Works with TextField too
          placeholder={placeholderText}
          sx={{
            mr: 1, // Add margin similar to the input
            '& .MuiOutlinedInput-root': {
              borderRadius: '20px', // Match previous border radius
              backgroundColor: '#4a4a4a', // Match previous background
              color: '#e0e0e0', // Match previous text color
              '& fieldset': { borderColor: '#555' }, // Match border color
              '&:hover fieldset': { borderColor: '#777' }, // Optional hover effect
              '&.Mui-focused fieldset': { borderColor: '#0b93f6' }, // Optional focus effect
            },
            '& .MuiInputBase-input': {
              color: '#e0e0e0',
            },
            '& .MuiInputBase-input::placeholder': {
              color: '#888',
            },
          }}
          InputProps={{
            // To handle potential type mismatches if needed
            type: 'text',
          }}
        />
        <Button
          variant="contained"
          onClick={handleSendMessage}
          disabled={sendDisabled}
          sx={{ borderRadius: '20px', whiteSpace: 'nowrap' }} // Add white-space: nowrap
        >
          {buttonText}
        </Button>
      </div>
      {/* Render the EventEditModal conditionally */}
      {isEventModalOpen && editingEvent && (
        <EventEditModal
          open={isEventModalOpen}
          event={editingEvent}
          onClose={handleCloseEventModal}
          onSave={handleSaveEvent}
        />
      )}
    </div>
  )
}

export default ChatPage
