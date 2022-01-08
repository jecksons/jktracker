import { useCallback, useEffect, useReducer, useState } from "react";
import Select from "react-select";
import {BsChevronDown,BsChevronRight, BsCaretRightFill } from 'react-icons/bs';
import {TiMediaStop} from 'react-icons/ti'; 
import api from "../../services/api";
import utils from "../../services/utils";
import AppHeader from "../controls/app-header";
import './styles.css';

const OpenedTaskOption = {value: 'O', label: 'Opened'};

const TaskStatusOptions = [
   OpenedTaskOption,
   {value: 'F', label: 'Finished'},
   {value: 'C', label: 'Cancelled'},
   {value: '-', label: 'All'},
]


function TimerTracking({taskId, startTime, onStartTracking, onStopTracking}) {

   const [totalTime, setTotalTime] = useState('00:00:00');

   useEffect(() => {
      if (startTime) {         
         const procTotalTime = () => {
            const dtFrom = new Date(startTime);
            const dtTo = new Date();                  
            setTotalTime(
                  utils.formatFloatAsTime(
                     ((dtTo.getTime() -  dtFrom.getTime() ) / 1000 / 60 / 60 / 24)  ));
                     
         };
         procTotalTime();
         const inter = setInterval(procTotalTime, 1000);
         return () => clearInterval(inter);
      } 
   }, [startTime]);

   return (
      <div className="jk-row-05">         
         <label>{totalTime}</label> 
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

function TaskItem({task, onStartTracking, onStopTracking, onAddChild}) {
  
   
   const [taskStatus, setTaskStatus] = useState(null);
   const [taskValues, dispatchTaskValues] = useReducer(reducerTaskValues, task);
   const [showChilds, setShowChilds] = useState(false);
   const [subTasks, setSubTasks] = useState([]);
   const [subTasksLoaded, setSubTasksLoaded] = useState(false);

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
      if (!subTasksLoaded && showChilds && task.has_childs) {
         const cancelToken = api.getCancelToken();
         const fetchTask = async () =>  {
            try {
               const ret = await api.get(`/tasks/?id_parent=${task.id}`);
               setSubTasks(ret.data);
               setSubTasksLoaded(true);
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

   }, [showChilds, task, subTasksLoaded])


   return <li key={task.id} className="jk-column" className={`task-item${task.id_task_parent > 0 ? '-child' : ''}`}>
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
                  <input type={'date'}  value={taskValues.estimated_time_str ?? (taskValues.estimated_time ?? 0)} step={0.01} type={'number'} onChange={(e) => dispatchTaskValues({field: 'estimated_time_str', value: e.target.value })} />
                  <label>{ utils.formatFloatAsTime(task.tracked_time) }</label>
                  <TimerTracking  taskId={task.id} startTime={task.start_time_tracking} 
                     onStartTracking={onStartTracking}
                     onStopTracking={onStopTracking}
                  />
            </div>               
         </div>
         {
            (subTasksLoaded && showChilds) &&
               <ul >
                  {subTasks.map((itm) => <TaskItem key={itm.id} onStopTracking={onStopTracking} onStartTracking={onStartTracking} task={itm}  /> )}
               </ul>
         }         
            
      </li>;
}


function AddNewTask({parentTask, onTaskAdded, onAddCancelled}) {

   const [description, setDescription] = useState('');

   const addTask = () => {
      if (description !== '') {
         let newTask = {
            description: description            
         };
         if (parentTask) {
            newTask.id_task_parent = parentTask.id;
         }
         api.post('/tasks/', newTask)
         .then(() => onTaskAdded() );
      }
   };

   return  (
      <div className="jk-column-05">
         <strong>New Task</strong>
         <div className="jk-row-05 width-100">         
         {
            parentTask && 
               <strong>Parent: {parentTask.description}</strong>                  
         }
         <div className="jk-column-05">
            <label>Description</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)}/>
         </div>
         <div className="jk-row-05">
            <button onClick={() => addTask()}>Add</button>
            <button onClick={() => onAddCancelled()} >Cancel</button>
         </div>
      </div>

      </div>
      
   )
}

export default function Home(props) {

   const [tasks, setTasks] = useState([]);
   const [statusFilter, setStatusFilter] = useState(OpenedTaskOption);
   const [keySearch, setKeySearch] = useState(0);
   const [addingNew, setAddingNew] = useState(false);
   const [parentTaskAdding, setParentTaskAdding] = useState(null);
   
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
      console.log('effect search');
      let strFilter = '';
      if (statusFilter && statusFilter.value !== '-') {
         strFilter = '?status=' + statusFilter.value;
      }
      const cancelToken = api.getCancelToken();
      const fetchTask = async () =>  {
         try {
            const ret = await api.get('/tasks/' + strFilter);
            setTasks(ret.data);
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

   const onTaskAdded = useCallback(() => {
      setKeySearch(prev => prev + 1);
      console.log('incremented key');
      setAddingNew(false);
   }, []);

   const onCloseAddTask = useCallback(() => {
      setAddingNew(false);
   }, []);

   const onRequestNewTask = useCallback((parentTask) => {
      setParentTaskAdding(parentTask);
      setAddingNew(true);      
   }, []);

   return (
      <div >
         <AppHeader />         
         <div className="main-content">
            <section className="jk-row-05 screen-header" >
               <h1>Tasks</h1>
               <div className="jk-row-05">
                  <Select 
                     options={TaskStatusOptions}
                     value={statusFilter}
                     classNamePrefix='av-select'
                     onChange={(itm) => setStatusFilter(itm)}
                  />
                  <button className="btn-action" onClick={() => onRequestNewTask()}>New task</button>
               </div>
               
            </section>
            <section className="tasks"> 
               <div className="jk-row-05 tasks-header">
                  <label className="header-description">Description</label>
                  <div className="detail-items ">
                     <label>Status</label>
                     <div> </div>
                     <label>Due Dates</label>
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
            </section>
            {
               addingNew &&
                  <AddNewTask 
                     parentTask={parentTaskAdding}   
                     onTaskAdded={onTaskAdded}
                     onAddCancelled={onCloseAddTask}
                     />
            }            
         </div>
      </div>
   );
}