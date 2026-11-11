import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Home from "./page";
import "./globals.css";

// After a new deploy, an old cached page may point at chunks that no longer exist.
window.addEventListener("vite:preloadError",(event)=>{
  event.preventDefault();
  try{
    if(sessionStorage.getItem("sim-studio:chunk-reload"))return;
    sessionStorage.setItem("sim-studio:chunk-reload","1");
  }catch{}
  location.reload();
});

const root=document.getElementById("root");
if(!root)throw new Error("No se encontró el contenedor principal");
createRoot(root).render(<StrictMode><Home/></StrictMode>);
