// import React, { useState, useRef, useEffect } from "react";
// import { Rnd } from "react-rnd";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";
// import {
//   differenceInDays,
//   parseISO,
//   addDays,
//   isBefore,
//   max as dateMax,
// } from "date-fns";
// import { v4 as uuidv4 } from "uuid";
// import {
//   startOfMonth,
//   endOfMonth,
//   format,
//   addMonths,
//   subMonths,
// } from "date-fns";

// const DAY_WIDTH = 60;

// /* ---------- MEMBERS ---------- */
// const MEMBERS = ["Govind", "Amit", "Rohit", "Neha"];

// /* ---------- HELPERS ---------- */
// const getDuration = (start, end) => {
//   const d = differenceInDays(parseISO(end), parseISO(start)) + 1;
//   return d < 1 ? 1 : d;
// };

// const getXFromDate = (date, startDate) =>
//   differenceInDays(parseISO(date), startDate) * DAY_WIDTH;

// const getDateFromX = (x, startDate) =>
//   format(addDays(startDate, Math.floor(x / DAY_WIDTH)), "yyyy-MM-dd");

// /* ---------- COMPONENT ---------- */
// const GanttChart = ({ tasks, setTasks }) => {
//   const [addingTask, setAddingTask] = useState(false);
//   const [newTaskName, setNewTaskName] = useState("");
//   const [selectedMember, setSelectedMember] = useState(MEMBERS[0]);
//   const [leftWidth, setLeftWidth] = useState(420);
//   const [editing, setEditing] = useState({ id: null, field: null });
//   const isDragging = useRef(false);

//   const today = new Date();
//   const [currentMonth, setCurrentMonth] = useState(new Date());
//   const startDate = startOfMonth(currentMonth);
//   const endDate = endOfMonth(currentMonth);
//   const TOTAL_DAYS = endDate.getDate();

//   const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
//   const goToPrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

//   const dragTaskIndex = useRef(null);

//   /* ---------- UPDATE TASK WITH DEPENDENCIES ---------- */
//   const updateTask = (id, newStart, newEnd) => {
//     setTasks((prev) =>
//       prev.map((task) => {
//         if (task.id !== id) return task;

//         let updatedTask = {
//           ...task,
//           start: newStart,
//           end: newEnd,
//         };

//         (task.depends_on || []).forEach((dep) => {
//           const depTask = prev.find((t) => t.id === dep.id);
//           if (!depTask) return;

//           const result = applyDependencyRule(depTask, updatedTask, dep.type);

//           updatedTask.start = result.start;
//           updatedTask.end = result.end;
//         });

//         return updatedTask;
//       })
//     );
//   };

//   /* ---------- REORDER TASKS ---------- */
//   const reorderTasks = (fromIndex, toIndex) => {
//     setTasks((prev) => {
//       const updated = [...prev];
//       const [moved] = updated.splice(fromIndex, 1);
//       updated.splice(toIndex, 0, moved);
//       return updated;
//     });
//   };

//   /* ---------- DIVIDER DRAG ---------- */
//   const startDragging = () => {
//     isDragging.current = true;
//     document.addEventListener("mousemove", onDrag);
//     document.addEventListener("mouseup", stopDragging);
//   };

//   const onDrag = (e) => {
//     if (e.clientX > 200 && e.clientX < window.innerWidth - 200)
//       setLeftWidth(e.clientX);
//   };

//   const stopDragging = () => {
//     isDragging.current = false;
//     document.removeEventListener("mousemove", onDrag);
//     document.removeEventListener("mouseup", stopDragging);
//   };

//   /* ---------- ADD TASK ---------- */
//   const addTask = () => {
//     if (!newTaskName.trim()) return;
//     setTasks((prev) => [
//       ...prev,
//       {
//         id: uuidv4(),
//         title: newTaskName,
//         member: selectedMember,
//         start: format(startDate, "yyyy-MM-dd"),
//         end: format(startDate, "yyyy-MM-dd"),
//         status: "New",
//         impact: "Medium",
//         depends_on: [],
//       },
//     ]);
//     setNewTaskName("");
//     setAddingTask(false);
//   };

//   /* ---------- DEPENDENCY DRAWING ---------- */
//   const [drawing, setDrawing] = useState(null);
//   const svgRef = useRef(null);
//   const [dependencies, setDependencies] = useState([]); // { from, to, type }

//   const startDrawing = (e, taskId, type) => {
//     e.stopPropagation();
//     const rect = svgRef.current.getBoundingClientRect();
//     setDrawing({
//       fromTaskId: taskId,
//       fromType: type,
//       startX: e.clientX - rect.left,
//       startY: e.clientY - rect.top,
//       x: e.clientX - rect.left,
//       y: e.clientY - rect.top,
//     });
//   };

//   useEffect(() => {
//     const move = (e) => {
//       if (!drawing) return;
//       const rect = svgRef.current.getBoundingClientRect();
//       setDrawing((d) => ({
//         ...d,
//         x: e.clientX - rect.left,
//         y: e.clientY - rect.top,
//       }));
//     };
//     const up = () => setDrawing(null);

//     window.addEventListener("mousemove", move);
//     window.addEventListener("mouseup", up);
//     return () => {
//       window.removeEventListener("mousemove", move);
//       window.removeEventListener("mouseup", up);
//     };
//   }, [drawing]);

//   const completeDependency = (toTaskId, toType) => {
//     if (!drawing || drawing.fromTaskId === toTaskId) return;

//     const depType = drawing.fromType + toType; // FS, SS, FF, SF

//     setDependencies((d) => [
//       ...d,
//       {
//         from: drawing.fromTaskId,
//         to: toTaskId,
//         type: depType,
//       },
//     ]);

//     setTasks((prev) =>
//       prev.map((t) => {
//         if (t.id === toTaskId) {
//           return {
//             ...t,
//             depends_on: [
//               ...(t.depends_on || []),
//               { id: drawing.fromTaskId, type: depType },
//             ],
//           };
//         }
//         return t;
//       })
//     );

//     setDrawing(null);
//   };

//   const ROW_HEIGHT = 48;
//   const BAR_HEIGHT = 32;

//   const getAnchorX = (taskId, type) => {
//     const task = tasks.find((t) => t.id === taskId);
//     if (!task) return 0;
//     const startX = getXFromDate(task.start, startDate);
//     const width = getDuration(task.start, task.end) * DAY_WIDTH;
//     return type === "E" ? startX + width : startX;
//   };

//   const getAnchorY = (taskId) => {
//     const index = tasks.findIndex((t) => t.id === taskId);
//     return index * ROW_HEIGHT + BAR_HEIGHT / 2;
//   };

//   // ---------- L-SHAPE PATH FOR DEPENDENCIES ----------
//   const getDependencyPath = (x1, y1, x2, y2, fromType, toType) => {
//     const GAP = 30;
//     const RADIUS = 10; // bend radius
//     let midX;
//     if (fromType === "E" && toType === "S") {
//       midX = Math.max(x1 + GAP, x2 - GAP); // FS
//     } else if (fromType === "S" && toType === "S") {
//       midX = Math.min(x1 - GAP, x2 - GAP); // SS
//     } else if (fromType === "E" && toType === "E") {
//       midX = Math.max(x1 + GAP, x2 + GAP); // FF
//     } else if (fromType === "S" && toType === "E") {
//       midX = Math.min(x1 - GAP, x2 + GAP); // SF
//     } else {
//       midX = (x1 + x2) / 2;
//     }

//     const dirX = midX > x1 ? 1 : -1;
//     const dirY = y2 > y1 ? 1 : -1;

//     return `
//     M ${x1} ${y1}
//     L ${midX - dirX * RADIUS} ${y1}
//     Q ${midX} ${y1} ${midX} ${y1 + dirY * RADIUS}
//     L ${midX} ${y2 - dirY * RADIUS}
//     Q ${midX} ${y2} ${midX + dirX * RADIUS} ${y2}
//     L ${x2} ${y2}
//   `;
//   };

//   const applyDependencyRule = (depTask, task, depType) => {
//     const depStart = parseISO(depTask.start);
//     const depEnd = parseISO(depTask.end);

//     let newStart = parseISO(task.start);
//     let newEnd = parseISO(task.end);
//     const duration = getDuration(task.start, task.end);

//     switch (depType) {
//       case "FS":
//         if (isBefore(newStart, addDays(depEnd, 1))) {
//           newStart = addDays(depEnd, 1);
//           newEnd = addDays(newStart, duration - 1);
//         }
//         break;

//       case "SS":
//         if (isBefore(newStart, depStart)) {
//           newStart = depStart;
//           newEnd = addDays(newStart, duration - 1);
//         }
//         break;

//       case "FF":
//         if (isBefore(newEnd, depEnd)) {
//           newEnd = depEnd;
//           newStart = addDays(newEnd, -(duration - 1));
//         }
//         break;

//       case "SF":
//         if (isBefore(newEnd, depStart)) {
//           newEnd = depStart;
//           newStart = addDays(newEnd, -(duration - 1));
//         }
//         break;

//       default:
//         break;
//     }

//     return {
//       start: format(newStart, "yyyy-MM-dd"),
//       end: format(newEnd, "yyyy-MM-dd"),
//     };
//   };

//   return (
//     <div
//       className="gantt-wrapper"
//       style={{ display: "flex", overflow: "hidden" }}
//     >
//       {/* LEFT PANEL */}
//       <div
//         className="gantt-left"
//         style={{
//           width: leftWidth,
//           overflowY: "auto",
//           borderRight: "1px solid #ccc",
//           background: "#f9f9f9",
//         }}
//       >
//         <div
//           className="task-header-row"
//           style={{ display: "flex", fontWeight: "bold", padding: "8px 0" }}
//         >
//           <div className="task-cell" style={{ flex: 1, paddingLeft: 8 }}>
//             Member
//           </div>
//           <div className="task-cell" style={{ flex: 2 }}>
//             Task
//           </div>
//           <div className="task-cell" style={{ flex: 1 }}>
//             Status
//           </div>
//           <div className="task-cell" style={{ flex: 1 }}>
//             Start
//           </div>
//           <div className="task-cell" style={{ flex: 1 }}>
//             End
//           </div>
//           <div className="task-cell" style={{ flex: 1 }}>
//             Impact
//           </div>
//           <div className="task-cell" style={{ flex: 2 }}>
//             Dependencies
//           </div>
//         </div>

//         {/* TASK ROWS */}
//         {tasks.map((task, index) => (
//           <div key={task.id} style={{ gap: "5px", padding: "10px" }}>
//             <div
//               className="task-row-horizontal draggable-row"
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 padding: "4px 0",
//                 borderBottom: "1px solid #eee",
//                 cursor: "grab",
//               }}
//               draggable
//               onDragStart={() => (dragTaskIndex.current = index)}
//               onDragOver={(e) => e.preventDefault()}
//               onDrop={() => {
//                 reorderTasks(dragTaskIndex.current, index);
//                 dragTaskIndex.current = null;
//               }}
//             >
//               <div className="task-cell" style={{ flex: 1, paddingLeft: 8 }}>
//                 {task.member}
//               </div>
//               <div className="task-cell" style={{ flex: 2 }}>
//                 {task.title}
//               </div>
//               <div className="task-cell" style={{ flex: 1 }}>
//                 {task.status}
//               </div>

//               {/* START */}
//               <div
//                 className="task-cell clickable-date"
//                 style={{ flex: 1 }}
//                 onClick={() => setEditing({ id: task.id, field: "start" })}
//               >
//                 {editing.id === task.id && editing.field === "start" ? (
//                   <DatePicker
//                     selected={parseISO(task.start)}
//                     autoFocus
//                     dateFormat="dd MMM"
//                     onChange={(date) => {
//                       const newStart = format(date, "yyyy-MM-dd");
//                       const duration = getDuration(task.start, task.end);
//                       const newEnd = format(
//                         addDays(parseISO(newStart), duration - 1),
//                         "yyyy-MM-dd"
//                       );
//                       updateTask(task.id, newStart, newEnd);
//                       setEditing({ id: null, field: null });
//                     }}
//                     onBlur={() => setEditing({ id: null, field: null })}
//                   />
//                 ) : (
//                   format(parseISO(task.start), "dd MMM")
//                 )}
//               </div>

//               {/* END */}
//               <div
//                 className="task-cell clickable-date"
//                 style={{ flex: 1 }}
//                 onClick={() => setEditing({ id: task.id, field: "end" })}
//               >
//                 {editing.id === task.id && editing.field === "end" ? (
//                   <DatePicker
//                     selected={parseISO(task.end)}
//                     minDate={parseISO(task.start)}
//                     autoFocus
//                     dateFormat="dd MMM"
//                     onChange={(date) => {
//                       updateTask(
//                         task.id,
//                         task.start,
//                         format(date, "yyyy-MM-dd")
//                       );
//                       setEditing({ id: null, field: null });
//                     }}
//                     onBlur={() => setEditing({ id: null, field: null })}
//                   />
//                 ) : (
//                   format(parseISO(task.end), "dd MMM")
//                 )}
//               </div>

//               <div className="task-cell" style={{ flex: 1 }}>
//                 {task.impact}
//               </div>

//               {/* DEPENDENCIES */}
//               <div className="task-cell" style={{ flex: 2 }}>
//                 {(task.depends_on || []).length > 0
//                   ? task.depends_on
//                       .map((d) => {
//                         const depTask = tasks.find((t) => t.id === d.id);
//                         return depTask ? `${d.type}` : "";
//                       })
//                       .join(", ")
//                   : "-"}
//               </div>
//             </div>
//           </div>
//         ))}

//         {/* ADD TASK */}
//         <div
//           className="task-input-row"
//           style={{ margin: "10px", display: "flex", gap: "5px" }}
//         >
//           {addingTask ? (
//             <>
//               <input
//                 autoFocus
//                 placeholder="Task name"
//                 value={newTaskName}
//                 onChange={(e) => setNewTaskName(e.target.value)}
//                 style={{ flex: 2 }}
//               />
//               <select
//                 value={selectedMember}
//                 onChange={(e) => setSelectedMember(e.target.value)}
//                 style={{ flex: 1 }}
//               >
//                 {MEMBERS.map((m) => (
//                   <option key={m}>{m}</option>
//                 ))}
//               </select>
//               <button onClick={addTask} style={{ flex: 1 }}>
//                 Add
//               </button>
//             </>
//           ) : (
//             <button
//               className="add-item-btn"
//               onClick={() => setAddingTask(true)}
//               style={{ width: "100%", marginTop: 5 }}
//             >
//               + Add Item
//             </button>
//           )}
//         </div>
//       </div>

//       {/* DIVIDER */}
//       <div
//         className="gantt-divider"
//         onMouseDown={startDragging}
//         style={{ width: "4px", cursor: "col-resize", background: "#ccc" }}
//       />

//       {/* RIGHT PANEL */}
//       <div
//         className="gantt-right"
//         style={{
//           flex: 1,
//           overflowX: "auto",
//           overflowY: "auto",
//           position: "relative",
//           background: "#fff",
//         }}
//       >
//         <div style={{ display: "flex", justifyContent: "space-between" }}>
//           <button onClick={goToPrevMonth} style={{ marginBottom: "38px" }}>
//             {"<"}
//           </button>
//           <h3 style={{ marginTop: "0px" }}>
//             {format(currentMonth, "MMMM yyyy")}
//           </h3>
//           <button onClick={goToNextMonth} style={{ marginBottom: "38px" }}>
//             {">"}
//           </button>
//         </div>

//         {/* Timeline header */}
//         <div
//           className="gantt-timeline-header"
//           style={{ display: "flex", borderBottom: "1px solid #ccc" }}
//         >
//           {Array.from({ length: TOTAL_DAYS }).map((_, i) => (
//             <div
//               key={i}
//               style={{
//                 width: DAY_WIDTH,
//                 textAlign: "center",
//                 borderRight: "1px solid #eee",
//                 fontSize: 12,
//               }}
//             >
//               {format(addDays(startDate, i), "dd MMM")}
//             </div>
//           ))}
//         </div>

//         {/* SVG DEPENDENCY LINES */}
//         <svg
//           ref={svgRef}
//           style={{
//             position: "absolute",
//             inset: 0,
//             marginTop: 50,
//             width: "100%",
//             height: "100%",
//             pointerEvents: "none",
//             zIndex: 10,
//           }}
//         >
//           <defs>
//             <marker
//               id="arrow"
//               markerWidth="10"
//               markerHeight="10"
//               refX="8"
//               refY="3"
//               orient="auto"
//             >
//               <path d="M0,0 L0,6 L9,3 z" fill="#333" />
//             </marker>
//           </defs>

//           {/* ACTIVE DRAWING LINE */}
//           {drawing && (
//             <path
//               d={getDependencyPath(
//                 drawing.startX,
//                 drawing.startY,
//                 drawing.x,
//                 drawing.y,
//                 drawing.fromType,
//                 drawing.fromType
//               )}
//               stroke="#ff5722"
//               strokeWidth="2"
//               fill="none"
//             />
//           )}

//           {/* SAVED DEPENDENCIES */}
//           {dependencies.map((d, i) => {
//             const x1 = getAnchorX(d.from, d.type[0]);
//             const y1 = getAnchorY(d.from);
//             const x2 = getAnchorX(d.to, d.type[1]);
//             const y2 = getAnchorY(d.to);
//             return (
//               <path
//                 key={i}
//                 d={getDependencyPath(x1, y1, x2, y2, d.type[0], d.type[1])}
//                 stroke="#333"
//                 strokeWidth="2"
//                 fill="none"
//                 markerEnd="url(#arrow)"
//               />
//             );
//           })}
//         </svg>

//         {/* TASK BARS */}
//         <div
//           className="gantt-task-lanes"
//           style={{ position: "relative", height: tasks.length * ROW_HEIGHT }}
//         >
//           {tasks.map((task, index) => (
//             <Rnd
//               key={task.id}
//               bounds="parent"
//               dragAxis="x"
//               disableDragging={!!drawing}
//               enableResizing={{ left: true, right: true }}
//               size={{
//                 width: getDuration(task.start, task.end) * DAY_WIDTH,
//                 height: BAR_HEIGHT,
//               }}
//               position={{
//                 x: getXFromDate(task.start, startDate),
//                 y: index * ROW_HEIGHT,
//               }}
//               onDragStop={(e, d) => {
//                 const newStart = getDateFromX(d.x, startDate);
//                 const duration = getDuration(task.start, task.end);
//                 updateTask(
//                   task.id,
//                   newStart,
//                   format(
//                     addDays(parseISO(newStart), duration - 1),
//                     "yyyy-MM-dd"
//                   )
//                 );
//               }}
//               onResizeStop={(e, dir, ref, delta, pos) => {
//                 let days = Math.round(ref.offsetWidth / DAY_WIDTH);
//                 if (days < 1) days = 1;
//                 let newStart = task.start;
//                 if (dir === "left") newStart = getDateFromX(pos.x, startDate);
//                 updateTask(
//                   task.id,
//                   newStart,
//                   format(addDays(parseISO(newStart), days - 1), "yyyy-MM-dd")
//                 );
//               }}
//               className="gantt-task-bar"
//             >
//               {task.title}
//               <div
//                 className="circle start-circle"
//                 onMouseDown={(e) => startDrawing(e, task.id, "S")}
//                 onMouseUp={() => completeDependency(task.id, "S")}
//               />
//               <div
//                 className="circle end-circle"
//                 onMouseDown={(e) => startDrawing(e, task.id, "E")}
//                 onMouseUp={() => completeDependency(task.id, "E")}
//               />
//             </Rnd>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default GanttChart;


import React, { useState, useRef, useEffect } from "react";
import { Rnd } from "react-rnd";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  differenceInDays,
  parseISO,
  addDays,
  isBefore,
  max as dateMax,
} from "date-fns";
import { v4 as uuidv4 } from "uuid";
import {
  startOfMonth,
  endOfMonth,
  format,
  addMonths,
  subMonths,
} from "date-fns";

const DAY_WIDTH = 60;
/* ---------- MEMBERS ---------- */
const MEMBERS = ["Govind", "Amit", "Rohit", "Neha"];

/* ---------- HELPERS ---------- */
const getDuration = (start, end) => {
  const d = differenceInDays(parseISO(end), parseISO(start)) + 1;
  return d < 1 ? 1 : d;
};

const getXFromDate = (date, startDate) =>
  differenceInDays(parseISO(date), startDate) * DAY_WIDTH;

const getDateFromX = (x, startDate) =>
  format(addDays(startDate, Math.floor(x / DAY_WIDTH)), "yyyy-MM-dd");

/* ---------- COMPONENT ---------- */
const GanttChart = ({ tasks, setTasks }) => {
  const [addingTask, setAddingTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [selectedMember, setSelectedMember] = useState(MEMBERS[0]);
  const [leftWidth, setLeftWidth] = useState(420);
  const [editing, setEditing] = useState({ id: null, field: null });
  const isDragging = useRef(false);
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const startDate = startOfMonth(currentMonth);
  const endDate = endOfMonth(currentMonth);
  const TOTAL_DAYS = endDate.getDate();

  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToPrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const dragTaskIndex = useRef(null);

  /* ---------- UPDATE TASK WITH DEPENDENCIES ---------- */
  const updateTask = (id, newStart, newEnd) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== id) return task;

        let updatedTask = {
          ...task,
          start: newStart,
          end: newEnd,
        };

        (task.depends_on || []).forEach((dep) => {
          const depTask = prev.find((t) => t.id === dep.id);
          if (!depTask) return;

          const result = applyDependencyRule(depTask, updatedTask, dep.type);

          updatedTask.start = result.start;
          updatedTask.end = result.end;
        });

        return updatedTask;
      })
    );
  };

  /* ---------- REORDER TASKS ---------- */
  const reorderTasks = (fromIndex, toIndex) => {
    setTasks((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  };

  /* ---------- DIVIDER DRAG ---------- */
  const startDragging = () => {
    isDragging.current = true;
    document.addEventListener("mousemove", onDrag);
    document.addEventListener("mouseup", stopDragging);
  };

  const onDrag = (e) => {
    if (e.clientX > 200 && e.clientX < window.innerWidth - 200)
      setLeftWidth(e.clientX);
  };

  const stopDragging = () => {
    isDragging.current = false;
    document.removeEventListener("mousemove", onDrag);
    document.removeEventListener("mouseup", stopDragging);
  };

  /* ---------- ADD TASK ---------- */
  const addTask = () => {
    if (!newTaskName.trim()) return;
    setTasks((prev) => [
      ...prev,
      {
        id: uuidv4(),
        title: newTaskName,
        member: selectedMember,
        start: format(startDate, "yyyy-MM-dd"),
        end: format(startDate, "yyyy-MM-dd"),
        status: "New",
        impact: "Medium",
        depends_on: [],
      },
    ]);
    setNewTaskName("");
    setAddingTask(false);
  };

  /* ---------- DEPENDENCY DRAWING ---------- */
  const [drawing, setDrawing] = useState(null);
  const svgRef = useRef(null);
  const [dependencies, setDependencies] = useState([]); // { from, to, type }

  const startDrawing = (e, taskId, type) => {
    e.stopPropagation();
    const rect = svgRef.current.getBoundingClientRect();
    setDrawing({
      fromTaskId: taskId,
      fromType: type,
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  useEffect(() => {
    const move = (e) => {
      if (!drawing) return;
      const rect = svgRef.current.getBoundingClientRect();
      setDrawing((d) => ({
        ...d,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }));
    };
    const up = () => setDrawing(null);

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [drawing]);

  const completeDependency = (toTaskId, toType) => {
    if (!drawing || drawing.fromTaskId === toTaskId) return;

    const depType = drawing.fromType + toType; // FS, SS, FF, SF

    setDependencies((d) => [
      ...d,
      {
        from: drawing.fromTaskId,
        to: toTaskId,
        type: depType,
      },
    ]);

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === toTaskId) {
          return {
            ...t,
            depends_on: [
              ...(t.depends_on || []),
              { id: drawing.fromTaskId, type: depType },
            ],
          };
        }
        return t;
      })
    );

    setDrawing(null);
  };

  const ROW_HEIGHT = 48;
  const BAR_HEIGHT = 32;

  const getAnchorX = (taskId, type) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return 0;
    const startX = getXFromDate(task.start, startDate);
    const width = getDuration(task.start, task.end) * DAY_WIDTH;
    return type === "E" ? startX + width : startX;
  };

  const getAnchorY = (taskId) => {
    const index = tasks.findIndex((t) => t.id === taskId);
    return index * ROW_HEIGHT + BAR_HEIGHT / 2;
  };

  // ---------- L-SHAPE PATH FOR DEPENDENCIES ----------
  const getDependencyPath = (x1, y1, x2, y2, fromType, toType) => {
    const GAP = 30;
    const RADIUS = 10; // bend radius
    let midX;
    if (fromType === "E" && toType === "S") {
      midX = Math.max(x1 + GAP, x2 - GAP); // FS
    } else if (fromType === "S" && toType === "S") {
      midX = Math.min(x1 - GAP, x2 - GAP); // SS
    } else if (fromType === "E" && toType === "E") {
      midX = Math.max(x1 + GAP, x2 + GAP); // FF
    } else if (fromType === "S" && toType === "E") {
      midX = Math.min(x1 - GAP, x2 + GAP); // SF
    } else {
      midX = (x1 + x2) / 2;
    }

    const dirX = midX > x1 ? 1 : -1;
    const dirY = y2 > y1 ? 1 : -1;

    return `
    M ${x1} ${y1}
    L ${midX - dirX * RADIUS} ${y1}
    Q ${midX} ${y1} ${midX} ${y1 + dirY * RADIUS}
    L ${midX} ${y2 - dirY * RADIUS}
    Q ${midX} ${y2} ${midX + dirX * RADIUS} ${y2}
    L ${x2} ${y2}
  `;
  };

  const applyDependencyRule = (depTask, task, depType) => {
    const depStart = parseISO(depTask.start);
    const depEnd = parseISO(depTask.end);

    let newStart = parseISO(task.start);
    let newEnd = parseISO(task.end);
    const duration = getDuration(task.start, task.end);

    switch (depType) {
      case "FS":
        if (isBefore(newStart, addDays(depEnd, 1))) {
          newStart = addDays(depEnd, 1);
          newEnd = addDays(newStart, duration - 1);
        }
        break;

      case "SS":
        if (isBefore(newStart, depStart)) {
          newStart = depStart;
          newEnd = addDays(newStart, duration - 1);
        }
        break;

      case "FF":
        if (isBefore(newEnd, depEnd)) {
          newEnd = depEnd;
          newStart = addDays(newEnd, -(duration - 1));
        }
        break;

      case "SF":
        if (isBefore(newEnd, depStart)) {
          newEnd = depStart;
          newStart = addDays(newEnd, -(duration - 1));
        }
        break;

      default:
        break;
    }

    return {
      start: format(newStart, "yyyy-MM-dd"),
      end: format(newEnd, "yyyy-MM-dd"),
    };
  };

  return (
    <div
      className="gantt-wrapper"
      style={{ display: "flex", overflow: "hidden" }}
    >
      {/* LEFT PANEL */}
      <div
        className="gantt-left"
        style={{
          width: leftWidth,
          overflowY: "auto",
          borderRight: "1px solid #ccc",
          background: "#f9f9f9",
        }}
      >
        <div
          className="task-header-row"
          style={{ display: "flex", fontWeight: "bold", padding: "8px 0" }}
        >
          <div className="task-cell" style={{ flex: 1, paddingLeft: 8 }}>
            Member
          </div>
          <div className="task-cell" style={{ flex: 2 }}>
            Task
          </div>
          <div className="task-cell" style={{ flex: 1 }}>
            Status
          </div>
          <div className="task-cell" style={{ flex: 1 }}>
            Start
          </div>
          <div className="task-cell" style={{ flex: 1 }}>
            End
          </div>
          <div className="task-cell" style={{ flex: 1 }}>
            Impact
          </div>
          <div className="task-cell" style={{ flex: 2 }}>
            Dependencies
          </div>
        </div>

        {/* TASK ROWS */}
        {tasks.map((task, index) => (
          <div key={task.id} style={{ gap: "5px", padding: "10px" }}>
            <div
              className="task-row-horizontal draggable-row"
              style={{
                display: "flex",
                alignItems: "center",
                padding: "4px 0",
                borderBottom: "1px solid #eee",
                cursor: "grab",
              }}
              draggable
              onDragStart={() => (dragTaskIndex.current = index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                reorderTasks(dragTaskIndex.current, index);
                dragTaskIndex.current = null;
              }}
            >
              <div className="task-cell" style={{ flex: 1, paddingLeft: 8 }}>
                {task.member}
              </div>
              <div className="task-cell" style={{ flex: 2 }}>
                {task.title}
              </div>
              <div className="task-cell" style={{ flex: 1 }}>
                {task.status}
              </div>

              {/* START */}
              <div
                className="task-cell clickable-date"
                style={{ flex: 1 }}
                onClick={() => setEditing({ id: task.id, field: "start" })}
              >
                {editing.id === task.id && editing.field === "start" ? (
                  <DatePicker
                    selected={parseISO(task.start)}
                    autoFocus
                    dateFormat="dd MMM"
                    onChange={(date) => {
                      const newStart = format(date, "yyyy-MM-dd");
                      const duration = getDuration(task.start, task.end);
                      const newEnd = format(
                        addDays(parseISO(newStart), duration - 1),
                        "yyyy-MM-dd"
                      );
                      updateTask(task.id, newStart, newEnd);
                      setEditing({ id: null, field: null });
                    }}
                    onBlur={() => setEditing({ id: null, field: null })}
                  />
                ) : (
                  format(parseISO(task.start), "dd MMM")
                )}
              </div>

              {/* END */}
              <div
                className="task-cell clickable-date"
                style={{ flex: 1 }}
                onClick={() => setEditing({ id: task.id, field: "end" })}
              >
                {editing.id === task.id && editing.field === "end" ? (
                  <DatePicker
                    selected={parseISO(task.end)}
                    minDate={parseISO(task.start)}
                    autoFocus
                    dateFormat="dd MMM"
                    onChange={(date) => {
                      updateTask(
                        task.id,
                        task.start,
                        format(date, "yyyy-MM-dd")
                      );
                      setEditing({ id: null, field: null });
                    }}
                    onBlur={() => setEditing({ id: null, field: null })}
                  />
                ) : (
                  format(parseISO(task.end), "dd MMM")
                )}
              </div>

              <div className="task-cell" style={{ flex: 1 }}>
                {task.impact}
              </div>

              {/* DEPENDENCIES */}
              <div className="task-cell" style={{ flex: 2 }}>
                {(task.depends_on || []).length > 0
                  ? task.depends_on
                      .map((d) => {
                        const depTask = tasks.find((t) => t.id === d.id);
                        return depTask ? `${d.type}` : "";
                      })
                      .join(", ")
                  : "-"}
              </div>
            </div>
          </div>
        ))}

        {/* ADD TASK */}
        <div
          className="task-input-row"
          style={{ margin: "10px", display: "flex", gap: "5px" }}
        >
          {addingTask ? (
            <>
              <input
                autoFocus
                placeholder="Task name"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                style={{ flex: 2 }}
              />
              <select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                style={{ flex: 1 }}
              >
                {MEMBERS.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
              <button onClick={addTask} style={{ flex: 1 }}>
                Add
              </button>
            </>
          ) : (
            <button
              className="add-item-btn"
              onClick={() => setAddingTask(true)}
              style={{ width: "100%", marginTop: 5 }}
            >
              + Add Item
            </button>
          )}
        </div>
      </div>

      {/* DIVIDER */}
      <div
        className="gantt-divider"
        onMouseDown={startDragging}
        style={{ width: "4px", cursor: "col-resize", background: "#ccc" }}
      />

      {/* RIGHT PANEL */}
      <div
        className="gantt-right"
        style={{
          flex: 1,
          overflowX: "auto",
          overflowY: "auto",
          position: "relative",
          background: "#fff",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button onClick={goToPrevMonth} style={{ marginBottom: "38px" }}>
            {"<"}
          </button>
          <h3 style={{ marginTop: "0px" }}>
            {format(currentMonth, "MMMM yyyy")}
          </h3>
          <button onClick={goToNextMonth} style={{ marginBottom: "38px" }}>
            {">"}
          </button>
        </div>

        {/* Timeline header */}
        <div
          className="gantt-timeline-header"
          style={{ display: "flex", borderBottom: "1px solid #ccc" }}
        >
          {Array.from({ length: TOTAL_DAYS }).map((_, i) => (
            <div
              key={i}
              style={{
                width: DAY_WIDTH,
                textAlign: "center",
                borderRight: "1px solid #eee",
                fontSize: 12,
              }}
            >
              {format(addDays(startDate, i), "dd MMM")}
            </div>
          ))}
        </div>

        {/* SVG DEPENDENCY LINES */}
        <svg
          ref={svgRef}
          style={{
            position: "absolute",
            inset: 0,
            marginTop: 50,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 10,
          }}
        >
          <defs>
            <marker
              id="arrow"
              markerWidth="10"
              markerHeight="10"
              refX="8"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L0,6 L9,3 z" fill="#333" />
            </marker>
          </defs>

          {/* ACTIVE DRAWING LINE */}
          {drawing && (
            <path
              d={getDependencyPath(
                drawing.startX,
                drawing.startY,
                drawing.x,
                drawing.y,
                drawing.fromType,
                drawing.fromType
              )}
              stroke="#ff5722"
              strokeWidth="2"
              fill="none"
            />
          )}

          {/* SAVED DEPENDENCIES */}
          {dependencies.map((d, i) => {
            const x1 = getAnchorX(d.from, d.type[0]);
            const y1 = getAnchorY(d.from);
            const x2 = getAnchorX(d.to, d.type[1]);
            const y2 = getAnchorY(d.to);
            return (
              <path
                key={i}
                d={getDependencyPath(x1, y1, x2, y2, d.type[0], d.type[1])}
                stroke="#333"
                strokeWidth="2"
                fill="none"
                markerEnd="url(#arrow)"
              />
            );
          })}
        </svg>

        {/* TASK BARS */}
        <div
          className="gantt-task-lanes"
          style={{ position: "relative", height: tasks.length * ROW_HEIGHT }}
        >
          {tasks.map((task, index) => (
            <Rnd
              key={task.id}
              bounds="parent"
              dragAxis="x"
              disableDragging={!!drawing}
              enableResizing={{ left: true, right: true }}
              size={{
                width: getDuration(task.start, task.end) * DAY_WIDTH,
                height: BAR_HEIGHT,
              }}
              position={{
                x: getXFromDate(task.start, startDate),
                y: index * ROW_HEIGHT,
              }}
              onDragStop={(e, d) => {
                const newStart = getDateFromX(d.x, startDate);
                const duration = getDuration(task.start, task.end);
                updateTask(
                  task.id,
                  newStart,
                  format(
                    addDays(parseISO(newStart), duration - 1),
                    "yyyy-MM-dd"
                  )
                );
              }}
              onResizeStop={(e, dir, ref, delta, pos) => {
                let days = Math.round(ref.offsetWidth / DAY_WIDTH);
                if (days < 1) days = 1;
                let newStart = task.start;
                if (dir === "left") newStart = getDateFromX(pos.x, startDate);
                updateTask(
                  task.id,
                  newStart,
                  format(addDays(parseISO(newStart), days - 1), "yyyy-MM-dd")
                );
              }}
              className="gantt-task-bar"
            >
              {task.title}
              <div
                className="circle start-circle"
                onMouseDown={(e) => startDrawing(e, task.id, "S")}
                onMouseUp={() => completeDependency(task.id, "S")}
              />
              <div
                className="circle end-circle"
                onMouseDown={(e) => startDrawing(e, task.id, "E")}
                onMouseUp={() => completeDependency(task.id, "E")}
              />
            </Rnd>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GanttChart;
