import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <main className="app">
      <section className="card">
        <span className="badge">cool-web</span>
        <h1>Hello, World</h1>
        <p className="subtitle">
          A Vite + React + TypeScript starter, ready to deploy on Netlify.
        </p>

        <div className="counter">
          <div className="count-value" aria-live="polite">
            {count}
          </div>
          <div className="controls">
            <button onClick={() => setCount((c) => c - 1)} aria-label="decrement">
              −
            </button>
            <button
              className="primary"
              onClick={() => setCount((c) => c + 1)}
              aria-label="increment"
            >
              Count up
            </button>
            <button onClick={() => setCount(0)} aria-label="reset">
              Reset
            </button>
          </div>
        </div>

        <p className="footer">Edit <code>src/App.tsx</code> and save to hot-reload.</p>
      </section>
    </main>
  )
}

export default App
