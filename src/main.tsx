import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";
import BasicCompass from "./BasicCompass.tsx";

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/compass-openlayer/compass" element={<BasicCompass />} />
      <Route path="/compass-openlayer/" element={<App />} />
    </>
  )
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
