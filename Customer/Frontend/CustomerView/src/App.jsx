import { useState } from 'react'
import './App.css'
import CustomerMenu from "./CustomerMenu";

function App() {
  return (
    <div>
      <header style={{ background: "#333", color: "#fff", padding: 16, textAlign: "center" }}>
        <h1 style={{ margin: 0 }}>Restaurant</h1>
      </header>
      <main>
        <CustomerMenu />
      </main>
    </div>
  )
}

export default App