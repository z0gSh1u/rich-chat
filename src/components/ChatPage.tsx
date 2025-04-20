import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next' // Import useTranslation
import './ChatPage.css' // We'll create this CSS file next
import { useConfig } from '../contexts/ConfigContext' // Import useConfig

interface Message {
  id: number
  text: string
  sender: 'user' | 'ai'
}

// Define the structure for OpenAI-compatible API messages
interface OpenAIMessage {
  role: 'user' | 'assistant'
  content: string
}

const DEFAULT_DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions' // Default URL
const DEEPSEEK_MODEL = 'deepseek-chat' // Or another model like deepseek-coder

const ChatPage: React.FC = () => {
  const { t } = useTranslation() // Initialize useTranslation
  const { apiKey, endpointUrl, isLoading: isConfigLoading } = useConfig() // Get endpointUrl
  const [messages, setMessages] = useState<Message[]>([]) // Start with empty messages
  const [inputText, setInputText] = useState<string>('')
  const [isAiResponding, setIsAiResponding] = useState<boolean>(false)
  const messagesEndRef = useRef<null | HTMLDivElement>(null) // For scrolling

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

  const handleSendMessage = async () => {
    const trimmedInput = inputText.trim()
    if (trimmedInput === '' || isAiResponding || isConfigLoading) return // Prevent sending if empty, AI is busy, or config loading

    // Use configured URL or default
    const apiUrl = endpointUrl || DEFAULT_DEEPSEEK_API_URL

    if (!apiKey) {
      alert(t('chat.alertConfigureApiKey')) // Translate alert
      return
    }
    // Optional: Add check for endpointUrl if you want to force user to set it
    // if (!apiUrl) {
    //   alert('Please configure the API Endpoint URL in the settings panel first.');
    //   return;
    // }

    const newUserMessage: Message = {
      id: Date.now(),
      text: trimmedInput,
      sender: 'user',
    }

    // Add user message and clear input
    const updatedMessages = [...messages, newUserMessage]
    setMessages(updatedMessages)
    setInputText('')
    setIsAiResponding(true)

    // Format messages for the API
    const apiMessages: OpenAIMessage[] = updatedMessages.map((msg) => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text,
    }))

    // --- Start Stream Handling ---
    let streamReaderErrored = false
    const aiMessageId = Date.now() + 1 // Unique ID for the incoming AI message
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
          model: DEEPSEEK_MODEL,
          messages: apiMessages,
          stream: true, // Enable streaming
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

      while (!done) {
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
              // console.log('Stream finished')
              done = true // Mark as done if API sends [DONE]
              break // Exit inner loop
            }
            if (jsonStr) {
              try {
                const parsed = JSON.parse(jsonStr)
                const delta = parsed.choices?.[0]?.delta?.content

                if (delta) {
                  // Append delta to the last AI message
                  setMessages((prevMessages) =>
                    prevMessages.map((msg) =>
                      msg.id === aiMessageId ? { ...msg, text: msg.text + delta } : msg
                    )
                  )
                }
              } catch (e) {
                console.error('Error parsing stream JSON:', jsonStr, e)
                // Decide if we should stop or continue
              }
            }
          }
        } // end while loop for lines
      } // end while loop for reader
    } catch (error) {
      console.error('Error processing stream:', error)
      streamReaderErrored = true // Flag error
      // Update the placeholder message with error info
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === aiMessageId
            ? {
                ...msg,
                text: t('chat.errorFetchingResponse', {
                  errorMessage: error instanceof Error ? error.message : String(error),
                }), // Translate error message
              }
            : msg
        )
      )
    } finally {
      // Only set to false if the stream finished without critical error during read
      if (!streamReaderErrored) {
        setIsAiResponding(false)
      }
      // If it errored, maybe leave isAiResponding true or handle differently
      // For now, we set it false, but the error message is shown.
      setIsAiResponding(false)
    }
    // --- End Stream Handling ---
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
      <div className="message-list">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.sender}`}>
            {/* Very basic markdown rendering for newlines - consider a library for full markdown */}
            {message.text.split('\n').map((line, index) => (
              <React.Fragment key={index}>
                {line}
                <br />
              </React.Fragment>
            ))}
          </div>
        ))}
        {/* Add a loading indicator */}
        {isAiResponding && (
          <div className="message ai loading">{t('chat.loadingIndicator')}</div>
        )}
        {/* Element to scroll to */}
        <div ref={messagesEndRef} />
      </div>
      <div className="input-area">
        {/* Consider using a TextField for better multiline support if needed */}
        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholderText} // Use translated placeholder
          disabled={sendDisabled}
        />
        <button onClick={handleSendMessage} disabled={sendDisabled}>
          {buttonText} {/* Use translated button text */}
        </button>
      </div>
    </div>
  )
}

export default ChatPage
