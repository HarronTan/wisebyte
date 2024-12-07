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
import { useEffect } from "react";
import { IonIcon } from "@ionic/react";
import * as Icons from "ionicons/icons";
function App() {
  useEffect(() => {
    const fetchCategories = async () => {
      await db.open();
      if (db.isOpen()) {
        const categoriesData = await db.table("categories").toArray();
        if (categoriesData.length === 0) {
          try {
            const ids = await db.table("categories").bulkPut(
              [
                {
                  name: "food",
                  target_amt: 300,
                  bkg_color: "#2D3047",
                  tags: ["Breakfast", "Lunch", "Dinner"],
                },
                {
                  name: "transport",
                  target_amt: 100,
                  bkg_color: "#38726C",
                  tags: ["Bus", "Cab", "train"],
                },
                {
                  name: "leisure",
                  target_amt: 200,
                  bkg_color: "#B9314F",
                  tags: [],
                },
              ],
              { allKeys: true }
            );
          } catch (err) {
            console.log(err);
          }
        }
      }
    };

    fetchCategories();
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

  type homePath = "/tab1" | "/";
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
