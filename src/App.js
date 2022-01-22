import Home from "./components/home";
import Tasks from "./components/tasks";
import './css/settings.css';
import './css/objects.css';
import './css/components.css';
import React  from "react";
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import TimeTracking from "./components/time-tracking";
import TaskEdit from "./components/task-edit";
import ScrollToTop from "./components/controls/scroll-to-top";


function App() {
  return (
    <div className="App">
        <BrowserRouter>
          <ScrollToTop>
            <Routes>
              <Route path="/" element={<Home/>} />
              <Route exact path="/tasks" element={<Tasks />} />
              <Route exact path="/tasks/edit/:taskCode" element={ <TaskEdit /> } />
              <Route exact path="/tracking" element={<TimeTracking />} />
              <Route path="*" element={<Home/>} />
            </Routes>
          </ScrollToTop>          
        </BrowserRouter>
    </div>
  );
}

export default App;
