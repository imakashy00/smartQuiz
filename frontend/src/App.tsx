// import { useState } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';import './output.css'
import Quiz from "./components/Quiz.tsx";

function App() {

  return (
      <Router>
          <Routes>
              <Route  path="/" element={<Quiz/>} />
          </Routes>
      </Router>
  )
}

export default App
