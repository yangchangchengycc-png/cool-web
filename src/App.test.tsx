import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders the hello world heading', () => {
    render(<App />)
    expect(
      screen.getByRole('heading', { name: /hello, world/i }),
    ).toBeInTheDocument()
  })

  it('increments the counter when "Count up" is clicked', () => {
    render(<App />)
    expect(screen.getByText('0')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /increment/i }))
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('resets the counter', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /increment/i }))
    fireEvent.click(screen.getByRole('button', { name: /reset/i }))
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})
