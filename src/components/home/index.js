import { useCallback, useEffect, useReducer, useState } from "react";
import Select from "react-select";
import {BsChevronDown,BsChevronRight, BsCaretRightFill } from 'react-icons/bs';
import {AiOutlineDown, AiOutlineUp} from 'react-icons/ai';
import {TiMediaStop} from 'react-icons/ti'; 
import api from "../../services/api";
import utils from "../../services/utils";
import AppHeader from "../controls/app-header";
import './styles.css';
import SurfaceLoading from '../controls/surface-loading';
import NewTask from "../controls/new-task";

const OpenedTaskOption = {value: 'O', label: 'Opened'};

const TaskStatusOptions = [
   OpenedTaskOption,
   {value: 'F', label: 'Finished'},
   {value: 'C', label: 'Cancelled'},
   {value: '-', label: 'All'},
]

function ActiveTaskTimer({task, onStartTracking, onStopTracking}) {

   const [totalTime, setTotalTime] = useState('00:00:00');
   const [opened, setOpened] = useState(true);

   useEffect(() => {      
      if (task && task.start_time) {         
         const procTotalTime = () => {
            const dtFrom = new Date(task.start_time);
            const dtTo = new Date();                  
            setTotalTime(
                  utils.formatFloatAsTime(
                     ((dtTo.getTime() -  dtFrom.getTime() ) / 1000 / 60 / 60 / 24)   
                     ));                     
         };
         procTotalTime();
         const inter = setInterval(procTotalTime, 1000);
         return () => clearInterval(inter);
      }  
   }, [task]);

   return task &&  (
      <section className={`sticky-timer${opened ? '' : '-hide'}`}>
         <button className="sticky-switch-open" onClick={() => setOpened(p => !p)}>
            {opened ? 
               <AiOutlineDown size={16} /> : 
               <AiOutlineUp size={16} /> 
            }
         </button>
         <div className={`sticky-timer-content${opened ? '' : '-hide'}`}>
            <div className="jk-row-05">
               <label className="sticky-curr-time">{totalTime}</label>
               <button className={`btn-itm-${task.start_time ? 'stop' : 'start'}`} onClick={() => {
                  if (task.start_time) {
                     onStopTracking();
                  }
                  else {
                     onStartTracking(task.id);
                  }            
               }} >{task.start_time ? <TiMediaStop size={16} /> : <BsCaretRightFill size={16} /> }</button>    
            </div>
            <p className="sticky-description">{task.description}</p>
         </div>
      </section>
   );
}

function TimerTracking({taskId, startTime, onStartTracking, onStopTracking, timeToSum}) {

   const [totalTime, setTotalTime] = useState('00:00:00');

   useEffect(() => {      
      if (startTime) {         
         const procTotalTime = () => {
            const dtFrom = new Date(startTime);
            const dtTo = new Date();                  
            setTotalTime(
                  utils.formatFloatAsTime(
                     ((dtTo.getTime() -  dtFrom.getTime() ) / 1000 / 60 / 60 / 24)   + (timeToSum ?? 0)                     
                     ));                     
         };
         procTotalTime();
         const inter = setInterval(procTotalTime, 1000);
         return () => clearInterval(inter);
      }  else if (timeToSum > 0) {
         setTotalTime(
            utils.formatFloatAsTime(
               timeToSum
               ));                     
      }
   }, [startTime, timeToSum]);

   return (
      <div className="jk-row-05">       
         {(startTime || (timeToSum > 0)) ?  <label>{totalTime}</label>    : <div className="time-empty-space"> </div>}         
         <button className={`btn-itm-${startTime ? 'stop' : 'start'}`} onClick={() => {
            if (startTime) {
               onStopTracking();
            }
            else {
               onStartTracking(taskId);
            }            
         }} >{startTime ? <TiMediaStop size={16} /> : <BsCaretRightFill size={16} /> }</button>               
      </div>
   )
}

function reducerTaskValues(state, action) {
   let newState = {...state};
   if (action.field === 'estimated_time_str') {
      newState.estimated_time = parseFloat(action.value);      
   }
   if (action.field === 'due_date_str') {
      if (!action.value || action.value === '') {
         newState.due_date = null;
      } else {
         const dueDt = utils.getStrToDate(action.value);
         newState.due_date = dueDt;
      }
   }
   newState[action.field] = action.value;   
   if (!action.initialLoading)  {
      newState.changed = true;
   }   
   return newState;
}

const SubTaskNone = 0;
const SubTaskLoading = 1;
const SubTaskLoaded = 2;

function TaskItem({task, onStartTracking, onStopTracking, onAddChild}) {
  
   
   const [taskStatus, setTaskStatus] = useState(null);
   const [taskValues, dispatchTaskValues] = useReducer(reducerTaskValues, task);
   const [showChilds, setShowChilds] = useState(false);
   const [subTasks, setSubTasks] = useState([]);
   const [subTasksLoad, setSubTasksLoad] = useState(SubTaskNone);   

   useEffect(() => {
      const optStatus = TaskStatusOptions.find((itm ) => itm.value === task.id_task_status);
      setTaskStatus(optStatus);
      if (task.due_date) {
         let dtDue = new Date(task.due_date);
         dispatchTaskValues({field: 'due_date_str', value: utils.getDateStr(dtDue), initialLoading: true });
      }
   }, [task]);

   useEffect(() => {
      if (taskValues.changed) {
         const inter = setTimeout(() => {         
            console.log(taskValues);
            api.post('/tasks/', taskValues);
         }, 500);   
         return () => clearInterval(inter);
      }
      
   }, [taskValues]);

   useEffect(() => {
      if ((subTasksLoad === SubTaskNone) && showChilds && task.has_childs) {
         setSubTasksLoad(SubTaskLoading);
         const cancelToken = api.getCancelToken();
         const fetchTask = async () =>  {
            try {
               const ret = await api.get(`/tasks/?id_parent=${task.id}`);
               setSubTasks(ret.data);
               setSubTasksLoad(SubTaskLoaded);
            }
            catch (err) {
               if (!api.isCancel(err)) {
                  console.log(err);
               }
            }      
         }
         fetchTask();      
         return () => cancelToken.cancel();
      }

   }, [showChilds, task, subTasksLoad])

   const renderNormalContent = () => {
      return (
         <div className="jk-row-05 task-item-content">
            <div className="parent-task-desc">
               <input className="task-description" value={taskValues.description} onChange={e => dispatchTaskValues({field: 'description', value: e.target.value})} />
               {
                  task.has_childs ? 
                  (
                     <div>
                        <button className="btn-icon" onClick={() => setShowChilds(prev => !prev)}> 
                        {
                              showChilds ? 
                                 <BsChevronDown size={16} />  :  
                                 <BsChevronRight size={16} />} </button>   
                     </div>
                  ) : (<div className="left-space-desc"> </div>)
               }
            </div>
            <div className="detail-items">
               <div>
                  <Select 
                     options={TaskStatusOptions}
                     value={taskStatus}
                     classNamePrefix='av-select'
                     onChange={(itm) => {
                        setTaskStatus(itm);
                        dispatchTaskValues({field: 'id_task_status', value: itm.value});
                     }}
                  />
               </div>       
               {
                  onAddChild ? <button className="btn-add-child" onClick={() => onAddChild(task)} >Add child</button> : <div> </div>
               }     
               <input value={taskValues.due_date_str ?? (taskValues.due_date ?? '') } onChange={(e) => dispatchTaskValues({field: 'due_date_str', value: e.target.value})} />
               <input value={taskValues.priority ?? 0} type={'number'} onChange={(e) => dispatchTaskValues({field: 'priority', value: e.target.value ? parseInt(e.target.value) : null  })} />
               <input  value={taskValues.estimated_time_str ?? (taskValues.estimated_time ?? 0)} step={0.01} type={'number'} onChange={(e) => dispatchTaskValues({field: 'estimated_time_str', value: e.target.value })} />
               <label>{ utils.formatFloatAsTime(task.tracked_time) }</label>
               <TimerTracking  taskId={task.id} startTime={task.start_time_tracking} 
                  onStartTracking={onStartTracking}
                  onStopTracking={onStopTracking}
               />
            </div>               
         </div>         
      );
   }

   const renderMobileContent = () => {
      return (
         <div className="jk-column-05 task-item-content-mobile">
            <div className="task-item-row-mob-top">
               <label>{taskValues.description}</label>
            </div>
            <div className="task-item-row-mob-bot">
               <div>
                  <Select 
                     options={TaskStatusOptions}
                     value={taskStatus}
                     classNamePrefix='av-select'
                     onChange={(itm) => {
                        setTaskStatus(itm);
                        dispatchTaskValues({field: 'id_task_status', value: itm.value});
                     }}
                  />
               </div>                      
               {
                  task.has_childs ? 
                  (
                     <div>
                        <button className="btn-icon" onClick={() => setShowChilds(prev => !prev)}> 
                        {
                              showChilds ? 
                                 <BsChevronDown size={16} />  :  
                                 <BsChevronRight size={16} />} </button>   
                     </div>
                  ) : (onAddChild ? <button className="btn-link" onClick={() => onAddChild(task)} >Add child</button> : <div> </div>)
               }
               <div className="task-item-track-det">
                  {
                     taskValues.estimated_time > 0 && 
                        <div className="jk-row-05">
                           <label className="lb-75">Estimated:</label>
                           <label className="lb-75">{utils.formatFloatAsTime(taskValues.estimated_time / 24, false)}</label>
                        </div>                                                             
                  }
                  <TimerTracking  taskId={task.id} startTime={task.start_time_tracking} 
                     onStartTracking={onStartTracking}
                     onStopTracking={onStopTracking}
                     timeToSum={task.tracked_time}
                  />                  
               </div>
            </div>
         </div>         
      );
   }

   return <li key={task.id}  className={`task-item${task.id_task_parent > 0 ? '-child' : ''}`}>

         {renderNormalContent()}
         {renderMobileContent()}
         {
            (showChilds) &&
               (
                  subTasksLoad === SubTaskLoaded ?  
                     <ul >
                        {subTasks.map((itm) => <TaskItem key={itm.id} onStopTracking={onStopTracking} onStartTracking={onStartTracking} task={itm}  /> )}
                     </ul>    : 
                     subTasksLoad === SubTaskLoading &&
                        <div className="sub-task-loading">
                           <SurfaceLoading size={20} />
                        </div>
               )               
         }         
            
      </li>;
}


export default function Home(props) {

   const [tasks, setTasks] = useState([]);
   const [statusFilter, setStatusFilter] = useState(OpenedTaskOption);
   const [keySearch, setKeySearch] = useState(0);
   const [addingNew, setAddingNew] = useState(false);
   const [parentTaskAdding, setParentTaskAdding] = useState(null);
   const [loadingTasks, setLoadingTasks] = useState(true);
   const [activeTask, setActiveTask] = useState(null);
   
   useEffect(() => {
      document.title = 'Tasks - JkTracker';
   }, []);

   const onStopTracking = useCallback(() => {
      api.post('tasks/track/', {action: 'F'})
      .then((ret) => setKeySearch(prev => prev + 1));
   }, []);

   const onStartTracking = useCallback((taskId) => {
      api.post('tasks/track/', {action: 'S', id_task: taskId})
      .then((ret) => setKeySearch(prev => prev + 1));
   }, []);

   useEffect(() => {
      let strFilter = '';
      if (statusFilter && statusFilter.value !== '-') {
         strFilter = '?status=' + statusFilter.value;
      }
      setLoadingTasks(true);
      const cancelToken = api.getCancelToken();
      const fetchTask = async () =>  {
         try {
            const ret = await api.get('/tasks/' + strFilter);
            setTasks(ret.data.results);
            setActiveTask(ret.data.activeTask);
            setLoadingTasks(false);
         }
         catch (err) {
            if (!api.isCancel(err)) {
               console.log(err);
            }
         }      
      }
      fetchTask();      
      return () => cancelToken.cancel();

   }, [statusFilter, keySearch]);


   const onCloseAddTask = useCallback((newTask) => {
      setAddingNew(false);
      if (newTask) {
         setKeySearch(prev => prev + 1);
      }
   }, []);

   const onRequestNewTask = useCallback((parentTask) => {
      setParentTaskAdding(parentTask);
      setAddingNew(true);      
   }, []);

   return (
      <div className="parent-home">
         <AppHeader />         
         <div className="main-content">
            <section className="jk-row-05 screen-header" >
               <h1>Tasks</h1>
               <div className="jk-row-05">
                  <div className="status-select-parent">
                     <Select 
                        options={TaskStatusOptions}
                        value={statusFilter}
                        classNamePrefix='av-select'
                        onChange={(itm) => setStatusFilter(itm)}
                     />
                  </div>
                  <button className="btn-action" onClick={() => onRequestNewTask()}>New task</button>
               </div>               
            </section>
            <section className="tasks"> 
               {
                  loadingTasks ? 
                     <div className="task-loading">
                        <SurfaceLoading />
                     </div> : 
                     <>
                        <div className="jk-row-05 tasks-header">
                           <label className="header-description">Description</label>
                           <div className="detail-items ">
                              <label>Status</label>
                              <div> </div>
                              <label>Due Date</label>
                              <label>Priority</label>
                              <label>Estimated time</label>
                              <label>Tracked time</label>
                              <label>Current</label>
                           </div>
                        </div>
                        <ul key={keySearch} className="tasks">
                           {tasks.map((itm) => <TaskItem 
                              key={itm.id} 
                              onStartTracking={onStartTracking}
                              onStopTracking={onStopTracking}
                              onAddChild={onRequestNewTask}
                              task={itm} 
                              /> )}
                        </ul>
                     </>
               }               
            </section>
            <NewTask 
               onCloseModal={onCloseAddTask}
               show={addingNew}
               parentTask={parentTaskAdding}
            />            
         </div>
         <ActiveTaskTimer task={activeTask}  onStartTracking={onStartTracking}
                              onStopTracking={onStopTracking} />
      </div>
   );
}