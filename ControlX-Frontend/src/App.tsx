import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import AdminOverview from "./pages/AdminOverview.tsx";
import AgentDashboard from "../src/pages/AgentDashboard.tsx";
import AdminAgents from "../src/pages/AdminAgents.tsx";
import AdminMissions from '../src/pages/AdminMissions';
import AdminMessages from "./pages/AdminMessages.tsx";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<AdminOverview/>} />
        <Route path="/agent" element={<AgentDashboard />} />
        <Route path="/admin/personnel" element={<AdminAgents />} />
        <Route path="/admin/missions" element={<AdminMissions />} />
        <Route path="/admin/comms" element={<AdminMessages />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;