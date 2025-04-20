import { TFunction } from 'i18next'
import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
dayjs.extend(isBetween)

import {
  CalendarState,
  PortfolioState,
  InvestmentStyleState,
} from '../contexts/ConfigContext'

interface InvestmentAdviceOptions {
  includeDate: boolean
  includeEvents: boolean
  includePortfolio: boolean
  includeStyle: boolean
}

/**
 * Builds the prompt for summarizing news headlines.
 * @param headlines - An array of news headline strings.
 * @param t - The translation function from i18next.
 * @returns The fully constructed prompt string.
 */
export const buildNewsSummaryPrompt = (
  headlines: string[],
  t: TFunction<'translation', undefined>
): string => {
  const promptHeader = t('chat.summarizePromptHeader')
  const headlinesString = headlines.map((title) => `- ${title}`).join('\n')
  const fullPrompt = `${promptHeader}\n\n${headlinesString}`
  return fullPrompt
}

// Add other prompt building functions here in the future if needed

// --- Investment Advice Prompt Builder ---

/**
 * Builds the prompt for getting investment advice.
 * @param t - The translation function from i18next.
 * @param options - Object indicating which sections to include.
 * @param calendar - The current calendar state.
 * @param portfolio - The current portfolio state.
 * @param investmentStyle - The current investment style state.
 * @returns The fully constructed prompt string.
 */
export const buildInvestmentAdvicePrompt = (
  t: TFunction<'translation', undefined>,
  options: InvestmentAdviceOptions,
  calendar: CalendarState | null,
  portfolio: PortfolioState | null,
  investmentStyle: InvestmentStyleState | null
): string => {
  const today = dayjs()
  const todayStr = today.format('YYYY-MM-DD')

  // Filter events for today and the next 6 days (total 7 days)
  const recentEvents = (calendar?.events ?? [])
    .filter((event) =>
      dayjs(event.date).isBetween(today.subtract(6, 'day'), today, 'day', '[]')
    )
    .map(
      (event) =>
        `- ${event.date}: ${event.title}${
          event.description ? ` (${event.description})` : ''
        }`
    )
    .join('\n')

  // Format portfolio holdings
  const portfolioStr = (portfolio?.holdings ?? [])
    .map(
      (h) =>
        `- ${h.name} (${t(`holdingType.${h.type}`, h.type)}): ${
          h.amount ? h.amount.toLocaleString() : 'N/A'
        }`
    )
    .join('\n')

  // Format investment styles
  const stylesStr = (investmentStyle?.items ?? [])
    .map((s) => `- ${s.description}`)
    .join('\n')

  // Assemble the prompt
  let prompt = `${t('chat.advicePromptHeader')}\n\n`
  if (options.includeDate) {
    prompt += `${t('chat.advicePromptDate')} ${todayStr}\n\n`
  }
  if (options.includeEvents) {
    prompt += `${t('chat.advicePromptEvents')}\n${
      recentEvents || t('chat.advicePromptNoEvents')
    }\n\n`
  }
  if (options.includePortfolio) {
    prompt += `${t('chat.advicePromptPortfolio')}\n${
      portfolioStr || t('portfolio.noHoldings')
    }\n\n`
  }
  if (options.includeStyle) {
    prompt += `${t('chat.advicePromptStyle')}\n${
      stylesStr || t('investStyle.noStyles')
    }\n\n`
  }
  prompt += t('chat.advicePromptInstruction')

  return prompt
}
