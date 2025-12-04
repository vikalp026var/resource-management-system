import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [backendStatus, setBackendStatus] = useState("loading...");

  useEffect(() => {
    fetch("http://localhost:8000/health")
      .then((res) => res.json())
      .then((data) => setBackendStatus(JSON.stringify(data)))
      .catch(() => setBackendStatus("Backend not reachable"));
  }, []);

  return (
    <div style={{ padding: 20, textAlign: "center" }}>
      <h1>Frontend is working 🎉</h1>
      <h2>Backend status:</h2>
      <p>{backendStatus}</p>
    </div>
  );
}

export default App;
