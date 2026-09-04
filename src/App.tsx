import './App.css'

function App() {
  return (
    <div className="app">
      <header className="topbar">
        <button className="icon-btn" aria-label="Sort habits" type="button">
          <SortIcon />
        </button>
        <h1>Habitude</h1>
        <button className="icon-btn" aria-label="Add habit" type="button">
          <PlusIcon />
        </button>
      </header>

      <main className="content">
        <div className="empty-state">
          <span className="empty-emoji" aria-hidden="true">
            🔥
          </span>
          <h2>No habits yet</h2>
          <p>Start your first streak to see it here.</p>
        </div>
      </main>
    </div>
  )
}

function SortIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M7 4v16m0 0-3-3m3 3 3-3M17 20V4m0 0 3 3m-3-3-3 3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default App
