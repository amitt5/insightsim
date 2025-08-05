// Google Analytics utility functions

export const GA_MEASUREMENT_ID = 'G-WNY1KJSVGG'

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    })
  }
}

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string
  category: string
  label?: string
  value?: number
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// Custom events for your app
export const trackSimulationCreated = (simulationType: string) => {
  event({
    action: 'simulation_created',
    category: 'engagement',
    label: simulationType,
  })
}

export const trackPersonaCreated = (personaType: string) => {
  event({
    action: 'persona_created',
    category: 'engagement',
    label: personaType,
  })
}

export const trackMessageSent = (simulationId: string) => {
  event({
    action: 'message_sent',
    category: 'engagement',
    label: simulationId,
  })
}

export const trackSubscriptionUpgrade = (plan: string) => {
  event({
    action: 'subscription_upgrade',
    category: 'conversion',
    label: plan,
  })
}

// Declare gtag function for TypeScript
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js',
      targetId: string | Date,
      config?: any
    ) => void
  }
} 