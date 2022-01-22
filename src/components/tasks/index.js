import { useCallback, useEffect, useReducer, useState } from "react";
import {Link, useNavigate} from 'react-router-dom';
import Select from "react-select";
import {BsChevronDown,BsChevronRight, BsCaretRightFill, BsCheck2 } from 'react-icons/bs';
import {AiOutlineDown, AiOutlineUp} from 'react-icons/ai';
import {TiMediaStop} from 'react-icons/ti'; 
import {MdOutlineEdit} from 'react-icons/md';
import api from "../../services/api";
import utils from "../../services/utils";
import AppHeader from "../controls/app-header";
import './styles.css';
import SurfaceLoading from '../controls/surface-loading';
import NewTask from "../controls/new-task";
import CheckButton from "../controls/check-button";
import {MdOutlineDone, MdOutlineCancel} from 'react-icons/md';
import {SuccessToast} from '../controls/toast';
import NotFoundSurface from '../controls/not-found-surface';
import PageTrack from "../controls/page-track";
import {useSessionStorage} from '../../hooks/utils-hooks';

const OpenedTaskOption = {value: 'O', label: 'Opened'};
const FinishedTaskOption = {value: 'F', label: 'Finished'};
const CancelledTaskOption = {value: 'C', label: 'Cancelled'};

export const TaskStatusOptions = [
   OpenedTaskOption,
   FinishedTaskOption,
   CancelledTaskOption
]

const TaskStatusOptionsFilter = [
   OpenedTaskOption,
   FinishedTaskOption,
   CancelledTaskOption,
   {value: '-', label: 'All'},
]

export const TaskStatusObj = {
   'O': 'Opened',
   'F': 'Finished',
   'C': 'Cancelled'
};

function reducerTasks(state, action) {

   switch (action.type) {
      case 'set':
         return action.values;
      case 'update':
         let newValues = [...state];
         action.values.forEach((itm) => {
            const tskIndex = newValues.findIndex((val, idx) => itm.id === val.id );
            if (tskIndex >= 0) {
               newValues[tskIndex] = itm;
            }
         })
         return newValues;
      case 'prop_change':
         let newVal = [...state];
         let tskIndex = newVal.findIndex((itm) => itm.id === action.id_task);
         if (tskIndex >= 0) {
            let newObj = {...newVal[tskIndex], ...action.newProps};
            /* key needed to update the childs */
            newObj.updKey = (((newObj.updKey ?? 0) * 1000) + 1) / 1000;
            newVal[tskIndex] = newObj;
         }
         return newVal;         
      case 'append':
         return [...state, ...action.values];
      case 'append_first':
         return [...action.values, ...state];
      default:
         throw new Error('Action not expected!');
   }
}


function ActiveTaskTimer({task, onStartTracking, onStopTracking}) {

   const [totalTime, setTotalTime] = useState('00:00:00');
   const [opened, setOpened] = useState(true);
   const [dtFrom, setDtFrom] = useState(null);

   useEffect(() => {
      if (task && task.start_time_tracking) {
         let dtStart = new Date(task.start_time_tracking);
         if (dtStart.getTime() > (new Date()).getTime() ) {
            dtStart = new Date();
         }
         setDtFrom(dtStart);
      } else {
         setDtFrom(null);
      }
   }, [task]);

   useEffect(() => {      
      if (task && dtFrom) {         
         const procTotalTime = () => {            
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
   }, [task, dtFrom]);


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
               <button className={`btn-itm-${task.start_time_tracking ? 'stop' : 'start'}`} onClick={() => {
                  if (task.start_time_tracking) {
                     onStopTracking();
                  }
                  else {
                     onStartTracking(task.id);
                  }            
               }} >{task.start_time_tracking ? <TiMediaStop size={16} /> : <BsCaretRightFill size={16} /> }</button>    
            </div>
            <p className="sticky-description">{task.description}</p>
         </div>
      </section>
   );
}

function TimerTracking({taskId, startTime, onStartTracking, onStopTracking, timeToSum, canStartStop}) {

   const [totalTime, setTotalTime] = useState('00:00:00');
   const [processingStartStop, setProcessingStartStop] = useState(false);
   const [dtFrom, setDtFrom] = useState(null);
   
   useEffect(() => {
      if (startTime) {
         let dtStart = new Date(startTime);
         if (dtStart.getTime() > (new Date()).getTime() ) {
            dtStart = new Date();
         }
         setDtFrom(dtStart);
      } else {
         setDtFrom(null);
      }
   }, [startTime]);

   useEffect(() => {      
      if (dtFrom) {         
         const procTotalTime = () => {
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
   }, [dtFrom, timeToSum]);

   return (
      <div className="jk-row-05">       
         {(startTime || (timeToSum > 0)) ?  <label>{totalTime}</label>    : <div className="time-empty-space"> </div>}         
         {
            canStartStop ? 
            (
               processingStartStop ? 
                  (
                     <div>
                        <SurfaceLoading size={24}/>
                     </div>   
                  ) : 
                  (
                     <button className={`btn-itm-${startTime ? 'stop' : 'start'}`} onClick={() => {
                        if (startTime) {
                           setProcessingStartStop(true);
                           onStopTracking()
                           .then((ret) => setProcessingStartStop(false));
                        }
                        else {
                           setProcessingStartStop(true);
                           onStartTracking(taskId)
                           .then((ret) => setProcessingStartStop(false));
                        }            
                     }} >{startTime ? <TiMediaStop size={16} /> : <BsCaretRightFill size={16} /> }</button>               
                  )
            )   : <div>  </div>
         }

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

function TaskItem({task, onStartTracking, onStopTracking, onAddChild, showClosedChilds, onUpdateTask}) {  
   
   const [taskStatus, setTaskStatus] = useState(null);
   const [taskValues, dispatchTaskValues] = useReducer(reducerTaskValues, task);
   const [showChilds, setShowChilds] = useState(false);
   const [subTasks, dispatchSubTasks] = useReducer(reducerTasks, []);
   const [subTasksLoad, setSubTasksLoad] = useState(SubTaskNone);   
   const [oldShowClosedChilds, setOldShowClosedChilds] = useState(false);
   const [prevChildUpdate, setPrevChildUpdate] = useState(null);
   const [editingDescription, setEditingDescription] = useState(false);
   const navigate = useNavigate();

   useEffect(() => {
      const optStatus = TaskStatusOptionsFilter.find((itm ) => itm.value === task.id_task_status);
      setTaskStatus(optStatus);
      if (task.due_date) {
         let dtDue = new Date(task.due_date);
         dispatchTaskValues({field: 'due_date_str', value: utils.getDateStr(dtDue), initialLoading: true });
      }
      if (task.childs_initially_expanded) {            
         setShowChilds(true);
      }
      
   }, [task]);

   useEffect(() => {
      if (taskValues.changed) {
         const inter = setTimeout(() => {         
            api.post('/tasks/', taskValues).then((ret) => onUpdateTask(ret.data));
         }, 1000);   
         return () => clearInterval(inter);
      }
      
   }, [taskValues, onUpdateTask]);

   const onUpdateSubTasks = useCallback((updatedTask) => {
      dispatchSubTasks({type: 'update', values: [updatedTask]});
   }, []);
   

   useEffect(() => {
      if (((subTasksLoad === SubTaskNone) || (showClosedChilds !== oldShowClosedChilds)  ) && showChilds && task.has_childs) {
         setSubTasksLoad(SubTaskLoading);
         setOldShowClosedChilds(showClosedChilds);
         const cancelToken = api.getCancelToken();
         const fetchTask = async () =>  {
            try {
               let filter = `id_parent=${task.id}`;
               const shouldShowClosedChilds = showClosedChilds || (task.id_task_status !== OpenedTaskOption.value);
               if (!shouldShowClosedChilds) {
                  if (task.id_task_status) {
                     if (task.id_task_status === OpenedTaskOption.value) {
                        filter += `&status=${OpenedTaskOption.value}`;
                     }
                  }
               }               
               filter += '&offset=0&limit=999';
               const ret = await api.get(`/tasks/?${filter}`);
               dispatchSubTasks({type: 'set', values: ret.data.tasks.results});
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
      } else {
         if (task && 
               (subTasksLoad === SubTaskLoaded) && 
               task.childsToUpdate && 
               (!prevChildUpdate || prevChildUpdate !== task.childsToUpdate)) {
            dispatchSubTasks({type: 'update', values: task.childsToUpdate.items});
            setPrevChildUpdate(task.childsToUpdate);
         }         
      }

   }, [showChilds, task, subTasksLoad, showClosedChilds, prevChildUpdate, oldShowClosedChilds])

   const renderNormalContent = () => {
      return (
         <div className="jk-row-05 task-item-content">
            <div className="parent-task-desc">
               {
                  editingDescription ? 
                     <div className="jk-row-05 width-100">
                        <input 
                           autoFocus={true}
                           className={`flex-1 inp-form ${task.id_task_status === CancelledTaskOption.value ? 'line-through' : ''}`} 
                           value={taskValues.description} 
                           onChange={e => dispatchTaskValues({field: 'description', value: e.target.value})} />  
                        <button className="btn-icon btn-no-shadow btn-pad-025" onClick={() => setEditingDescription(false)}> <BsCheck2 size={16} /> </button>                  
                     </div> :                     
                     <div className="jk-row-05 flex-1 parent-link-desc">
                        <Link className="task-description" to={`/tasks/edit/${task.unique_code}`}>{taskValues.description}</Link>
                        <button className="btn-icon btn-no-shadow btn-pad-025" onClick={() => setEditingDescription(true)}> <MdOutlineEdit size={16} />  </button>                  
                     </div>               
               }               
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
                  ) : 
                  (
                     task.id_task_status === FinishedTaskOption.value ? 
                        <div className="finished-icon"><MdOutlineDone size={16} /></div> : 
                        (
                           task.id_task_status === CancelledTaskOption.value ? 
                              <div className="cancelled-icon"><MdOutlineCancel size={16} /></div> : 
                              (<div className="left-space-desc"> </div>)
                        )
                  )                                                   
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
                  canStartStop={task.id_task_status === OpenedTaskOption.value}
               />
            </div>               
         </div>         
      );
   }

   const handleClickTask = useCallback((e) => {
      e.preventDefault();
      if (utils.hasClickedOnClass(e.target, 'task-item-content-mobile', ['BUTTON', 'A'], ['av-select__control', 'av-select__option'])) {
         navigate(`/tasks/edit/${task.unique_code}`);
      }      
   }, [task.unique_code, navigate]);

   const renderMobileContent = () => {
      return (
         <div className="jk-column-05 task-item-content-mobile" onClick={handleClickTask}>
            <div className="task-item-row-mob-top">
               <label className={`${task.id_task_status === CancelledTaskOption.value ? 'line-through' : ''}`}>{taskValues.description}</label>
            </div>
            <div className="task-item-row-mob-bot">
               <div className="parent-sel-status-mob">
                  <Select 
                     options={TaskStatusOptionsFilter}
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
                  ) : (onAddChild ? <button className="btn-link btn-add-child-mob" onClick={() => onAddChild(task)} >Add child</button> : <div> </div>)
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
                     canStartStop={task.id_task_status === OpenedTaskOption.value}
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
                        {subTasks.map((itm) => <TaskItem key={itm.id} 
                           onStopTracking={onStopTracking} 
                           onStartTracking={onStartTracking} 
                           onUpdateTask={onUpdateSubTasks}
                           task={itm}  /> )}
                     </ul>    : 
                     subTasksLoad === SubTaskLoading &&
                        <div className="sub-task-loading">
                           <SurfaceLoading size={20} />
                        </div>
               )               
         }         
            
      </li>;
}


const TaskPageSize = 15;

const DefaultTaskSortOption = {value: 0, label: 'Sort order'};

const TaskSortOptions = [
   DefaultTaskSortOption,
   {value: 1, label: 'Description', sort_by: 'description', order_by: 'asc'},
   {value: 2, label: 'Description (z - a)', sort_by: 'description', order_by: 'desc'},
   {value: 3, label: 'Due date', sort_by: 'due_date', order_by: 'asc'},
   {value: 4, label: 'Due date (z - a)', sort_by: 'due_date', order_by: 'desc'},
   {value: 5, label: 'Estimated time', sort_by: 'estimated_time', order_by: 'asc'},
   {value: 6, label: 'Estimated time (z - a)', sort_by: 'estimated_time', order_by: 'desc'},
   {value: 7, label: 'Priority', sort_by: 'priority', order_by: 'asc'},
   {value: 8, label: 'Priority (z - a)', sort_by: 'priority', order_by: 'desc'}
]

export default function Home(props) {
   
   const [tasks, dispatchTasks] = useReducer(reducerTasks, []);
   const [statusFilter, setStatusFilter] = useSessionStorage('task-statusFilter', OpenedTaskOption);
   const [keySearch, setKeySearch] = useState(0);
   const [addingNew, setAddingNew] = useState(false);
   const [parentTaskAdding, setParentTaskAdding] = useState(null);
   const [loadingTasks, setLoadingTasks] = useState(true);
   const [activeTask, setActiveTask] = useState(null);
   const [showClosedChilds, setShowClosedChilds] = useState(false);
   const [searchMetadata, setSearchMetadata] = useState(null);
   const [offsetSearch, setOffsetSearch] = useSessionStorage('task-offset', 0);
   const [sortOption, setSortOption] = useSessionStorage('task-sortOption', DefaultTaskSortOption);
   
   useEffect(() => {
      document.title = 'Tasks - JkTracker';
   }, []);

   const onStopTracking = useCallback(async () => {
      const ret = await api.post('tasks/track/', {action: 'F'}); 
      if (ret.data.previousTask) {
         let itmUpdate = ret.data.previousTask;
         if (itmUpdate.parent_data) {
            itmUpdate = {...itmUpdate.parent_data, childsToUpdate: {items: [itmUpdate]}};
         }
         dispatchTasks({type: 'update', values: [itmUpdate]});
      }
      setActiveTask(null);
   }, []);

   const onStartTracking = useCallback(async (taskId) => {
      const ret = await api.post('tasks/track/', {action: 'S', id_task: taskId});
      let updTasks = [];         
      const currTask = ret.data.currentTask;
      const prevTask = ret.data.previousTask;         
      setActiveTask(currTask);
      if (currTask && prevTask) {
         /* this treatment is for update beetwen siblings */
         if (currTask.parent_data && prevTask.parent_data) {
            if (currTask.parent_data.id === prevTask.parent_data.id) {                  
               dispatchTasks({type: 'update', values: [
                  {...currTask.parent_data, childsToUpdate: {items: [currTask, prevTask]}}

               ]});                  
               return;
            }
         }
         /* this treatment is for parent-child toggle */
         if (currTask.parent_data) {
            if (currTask.parent_data.id === prevTask.id) {
               dispatchTasks({type: 'update', values: [
                  {...currTask.parent_data, childsToUpdate: {items: [currTask]}}
               ]});                  
               return;
            }               
         }
         
      }
      if (currTask) {
         if (currTask.parent_data) {
            updTasks.push({...currTask.parent_data, childsToUpdate: {items: [currTask]}});
         } else {
            updTasks.push(currTask);
         }                        
      }
      if (prevTask) {
         if (prevTask.parent_data) {               
            updTasks.push({...prevTask.parent_data, childsToUpdate: {items: [prevTask]}});
         } else {
            updTasks.push(prevTask);
         }            
      }
      if (updTasks.length > 0) {
         dispatchTasks({type: 'update', values: updTasks});
      }
   }, []);

   const onUpdateTask = useCallback((updatedTask) => {
      dispatchTasks({type: 'update', values: [updatedTask]});
   }, [])

   useEffect(() => {
      let strFilter = `?offset=${offsetSearch}&limit=${TaskPageSize}`;
      if (statusFilter && statusFilter.value !== '-') {
         strFilter += '&status=' + statusFilter.value;
      }      
      if (sortOption && sortOption.sort_by) {
         strFilter += `&sort_by=${sortOption.sort_by}&order_by=${sortOption.order_by}`;
      }
      setLoadingTasks(true);
      const cancelToken = api.getCancelToken();
      const fetchTask = async () =>  {
         try {
            const ret = await api.get('/tasks/' + strFilter);
            dispatchTasks({type: 'set', values: ret.data.tasks.results});
            setSearchMetadata(ret.data.tasks.metadata);
            setActiveTask(ret.data.activeTask ?? null);
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

   }, [statusFilter, keySearch, offsetSearch, sortOption]);


   const onCloseAddTask = useCallback((newTask) => {
      setAddingNew(false);
      if (newTask) {         
         if (statusFilter?.value === OpenedTaskOption.value) {
            if (newTask.id_task_parent)  {
               dispatchTasks({
                  type: 'prop_change', 
                  id_task: newTask.id_task_parent, 
                  newProps: {has_childs: true, childs_initially_expanded: true}});
            } else {
               dispatchTasks({type: 'append_first', values: [newTask]});
            }            
         } else {
            setKeySearch(prev => prev + 1);            
         }         
         SuccessToast.fire({
            icon: 'success',
            title: 'Task added with success'
         });
      }
   }, [statusFilter]);

   const onRequestNewTask = useCallback((parentTask) => {
      setParentTaskAdding(parentTask);
      setAddingNew(true);      
   }, []);


   const toggleShowClosedChilds = useCallback(() => {
      setShowClosedChilds(p => !p);      
   }, []);

   return (
      <div className="parent-home">
         <AppHeader selOption={'tasks'} />         
         <div className="main-content">
            <section className="jk-row-05 screen-header flex-wrap" >
               <h1>Tasks</h1>
               <div className="jk-row-05 flex-wrap just-center">       
                  {statusFilter?.value === OpenedTaskOption.value && <CheckButton checked={showClosedChilds} onToggle={toggleShowClosedChilds} caption={'Show closed childs'} />           } 
                  <div className="status-select-parent">
                     <Select 
                        options={TaskStatusOptionsFilter}
                        value={statusFilter}
                        classNamePrefix='av-select'
                        onChange={(itm) => {
                           setStatusFilter(itm);
                           setOffsetSearch(0);
                        }}
                     />
                  </div>
                  <button className="btn-action min-width-8" onClick={() => onRequestNewTask()}>New task</button>
               </div>               
            </section>
            <section className="tasks"> 
               {
                  loadingTasks && !searchMetadata ? 
                     <div className="task-loading">
                        <SurfaceLoading />
                     </div> : 
                     <>
                        <div className="jk-column flex-1">
                           <div className="task-header-options parent-select-form parent-select-color-3" > 
                              <div className='min-width-12'>
                                 <div className='parent-select-100'>
                                    <Select 
                                       options={TaskSortOptions}
                                       defaultValue={sortOption}
                                       onChange={(opt) => setSortOption(opt)}
                                       classNamePrefix='av-select'
                                    />
                                 </div>
                              </div>                              
                              <PageTrack rowOffset={searchMetadata.offset}  rowTotal={searchMetadata.total} pageSize={TaskPageSize} onSelectOffset={(newValue) => setOffsetSearch(newValue)} />
                           </div>
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
                           {
                              loadingTasks ? 
                                 <SurfaceLoading /> : 
                                 (
                                    tasks.length > 0 ? 
                                    (
                                       <ul key={keySearch} className="jk-column width-100 flex-1 just-start">
                                          {tasks.map((itm) => <TaskItem 
                                             key={itm.id + (itm.updKey ?? 0) } 
                                             onStartTracking={onStartTracking}
                                             onStopTracking={onStopTracking}
                                             onAddChild={onRequestNewTask}
                                             onUpdateTask={onUpdateTask}                              
                                             showClosedChilds={showClosedChilds}
                                             task={itm} 
                                             /> )}                                    
                                       </ul>
                                    ) : 
                                    <NotFoundSurface title="Still aren't tasks created." message="Try to create a new task." />      
                                 )                                                   
                           }
                        </div>                       
                        
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

