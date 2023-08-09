import React from "react";
import logo from "./logo.svg";
import "./App.css";
import WalletConnect from "./walletConnect/wallet-connect";
import {BrowserRouter as Router, Route, Link, Routes} from "react-router-dom";
import HowTo from "./howTo/how-to";
import {ToastContainer} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" Component={HowTo} />
          <Route path="/demo" Component={WalletConnect} />
        </Routes>
      </Router>
      <ToastContainer />
    </div>
  );
}

export default App;
