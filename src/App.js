
import React, { useState } from "react";
import GanttChart from "./components/GanttChart";
import "./App.css";

function App() {
const [tasks, setTasks] = useState([
  { id: "1", title: "Requriment About Task", porgress:30,start: "2026-01-02", end: "2026-01-05", status: "In Progress", impact: "High", member:'Sunil', depends_on: [] },
  { id: "2", title: "Design UI", start: "2026-01-03",porgress:70, end: "2026-01-06", status: "In Progress", impact: "High", member:'Govind', depends_on: [] },
  { id: "3", title: "API Integration", start: "2026-01-04",porgress:80, end: "2026-01-07", status: "Not Started", impact: "Medium", member:'Ravi', depends_on: [] },
  { id: "4", title: "Testing", start: "2026-01-05", end: "2026-01-08",porgress:100, status: "Not Started", impact: "Low", member:'Anil', depends_on: [] }
]);
   

  return (
    <div className="container" >
      <h1>Gantt View</h1>
      <GanttChart tasks={tasks} setTasks={setTasks} />
    </div>
  );
}

export default App;
