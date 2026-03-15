import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from "./routes/Routes";
import { ToastProvider } from "./components/ui/ToastProvider";
import "./styles/App.css";

function App() {
  return (
    <Router>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </Router>
  );
}

export default App;
