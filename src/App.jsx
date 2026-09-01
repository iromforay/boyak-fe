import { useState } from "react";
import Header from "./components/Header";
import SearchScreen from "./components/SearchScreen";
import PhotoFlow from "./components/PhotoFlow";
import "./App.css";

export default function App() {
  const [mode, setMode] = useState("photo"); // photo | search

  return (
    <div className="app">
      <Header mode={mode} onModeChange={setMode} />
      {mode === "search" ? <SearchScreen /> : <PhotoFlow />}
    </div>
  );
}
