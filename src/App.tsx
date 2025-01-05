import "./App.css";
import {
  BrowserRouter as Router,
  Route,
  NavLink,
  Routes,
} from "react-router-dom";
import { FaHome, FaCamera, FaEllipsisH } from "react-icons/fa"; // Icons for the tabs (from react-icons)
import "bootstrap/dist/css/bootstrap.min.css";

import img from "./assets/mobile_illustration.jpg";

import Tab1 from "./pages/Tab1";
import Tab2 from "./pages/Tab2";
import Tab3 from "./pages/Tab3";

import db from "./db";
import { useEffect, useState } from "react";
import { IonIcon } from "@ionic/react";
import * as Icons from "ionicons/icons";
function App() {
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    async function initializeDatabase() {
      try {
        await db.open(); // Wait for the database to open and migrations to complete
        setIsReady(true); // Set the state to indicate readiness
      } catch (error) {
        console.error("Database initialization failed:", error);
      }
    }

    initializeDatabase();

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        navigator.serviceWorker.addEventListener("message", (event) => {
          if (event.data?.type === "CACHE_UPDATED") {
            showNotification("Content has been cached for offline use!");
          }
        });
      });
    }
  }, []);

  const showNotification = (message: string) => {
    // Customize this function to display a toast notification
    alert(message); // Replace with a better UI, e.g., a toast
  };

  if (!isMobileDevice())
    return (
      <div className="mobile-only-container">
        <h1 className="mobile-only-title">App Only Works On Mobile</h1>
        <p className="mobile-only-text">
          Please access this app from your mobile device for the best
          experience.
        </p>
        <div className="mobile-only-image">
          <img src={img} alt="Mobile illustration" />
        </div>
      </div>
    );

  if (isReady === false) return <div>Loading...</div>;

  return (
    <Router>
      <div className="app background">
        {/* Main content for tabs */}
        <div className="tab-content">
          <Routes>
            <Route path="/" Component={Tab1} />
            <Route path="/tab2" Component={Tab2} />
            <Route path="/tab3" Component={Tab3} />
          </Routes>
        </div>

        {/* Bottom tab bar */}
        <div className="tab-bar">
          <NavLink
            to="/"
            className={({ isActive }) => (isActive ? "active-tab" : "")}
          >
            <div className="Icon-container">
              <IonIcon icon={Icons.home} />
            </div>
            <span>Home</span>
          </NavLink>
          <NavLink
            to="/tab2"
            className={({ isActive }) => (isActive ? "active-tab" : "")}
          >
            <div className="Icon-container">
              <IonIcon icon={Icons.apertureOutline} />
            </div>
            <span>Insights</span>
          </NavLink>
          <NavLink
            to="/tab3"
            className={({ isActive }) => (isActive ? "active-tab" : "")}
          >
            <div className="Icon-container">
              <IonIcon icon={Icons.ellipsisHorizontalCircleOutline} />
            </div>
            <span>Settings</span>
          </NavLink>
        </div>
      </div>
    </Router>
  );
}

function isMobileDevice(): boolean {
  // Check if the user agent corresponds to a mobile device
  return /android|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(
    navigator.userAgent
  );
}

export default App;
