import Home from "./components/home";
import Tasks from "./components/tasks";
import './css/settings.css';
import './css/objects.css';
import './css/components.css';
import React  from "react";
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import TimeTracking from "./components/time-tracking";


function App() {
  return (
    <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home/>} />
            <Route exact path="/tasks" element={<Tasks />} />
            <Route exact path="/tracking" element={<TimeTracking />} />
            <Route path="*" element={<Home/>} />
          </Routes>
        </BrowserRouter>
    </div>
  );
}

export default App;
