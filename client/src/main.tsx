import { createRoot } from "react-dom/client";
import App from "./App";
import { loadPluvus } from "./lib/pluvus";
import "./index.css";

void loadPluvus();
createRoot(document.getElementById("root")!).render(<App />);
