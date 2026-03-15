import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from "./routes/Routes";
import { ToastProvider } from "./components/ui/ToastProvider";
import ErrorBoundary from "./components/ErrorBoundary";
import "./styles/App.css";

function App() {
  return (
    <Router>
      <ToastProvider>
        <ErrorBoundary>
          <AppRoutes />
        </ErrorBoundary>
      </ToastProvider>
    </Router>
  );
}

export default App;
