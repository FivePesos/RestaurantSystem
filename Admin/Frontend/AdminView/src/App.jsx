import { useState } from 'react'
import './App.css'
import Menu from "./Menu";


function App() {
  return (
    <div className="card">
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Restaurant Admin</h1>
      </header>
      <main>
        <Menu />
      </main>
    </div>
  )
}
export default App
