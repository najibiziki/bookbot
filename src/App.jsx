import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <h1>BookBot App</h1>
        <p>The dashboard will go here.</p>

        {/* We will add routes here later */}
        <Routes>
          {/* <Route path="/register" element={<Register />} /> */}
          {/* <Route path="/dashboard/:id" element={<Dashboard />} /> */}
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
