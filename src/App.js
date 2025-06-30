import React from "react";
import "./App.css";
import NavBar from "./components/NavBar";
import Home from "./components/Home";

function App() {
  return (
    <div className="App">
      <NavBar />
      <main className="main-content">
        <Home />
      </main>
    </div>
  );
}

export default App;
