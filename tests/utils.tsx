import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'

// Custom render function for testing
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, options)
}

// Re-export everything
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'