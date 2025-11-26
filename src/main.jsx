import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './styles/global.css';
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { HeroUIProvider } from "@heroui/react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Canchas from "./pages/Canchas";
import Reserva from "./pages/Reserva";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Payment from "./pages/Payment";
import Confirmation from "./pages/Confirmation";
import Profile from "./pages/Profile";
import ProfileEdit from "./pages/ProfileEdit";
import Admin from "./pages/Admin";
import { AdminGuard } from "./components/AdminGuard.jsx";

function App() {
  return (
    <HeroUIProvider>
      <AuthProvider>
        <Router>
          <div className="app">
            <Header />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/canchas" element={<Canchas />} />
                <Route path="/reserva" element={<Reserva />} />
                <Route path="/reserva/:id" element={<Reserva />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/payment" element={<Payment />} />
                <Route path="/confirmation" element={<Confirmation />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/edit" element={<ProfileEdit />} />
                <Route path="/admin" element={
                  <AdminGuard>
                    <Admin />
                  </AdminGuard>
                } />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </HeroUIProvider>
  );
}

createRoot(document.getElementById("root")).render(<App />);
