import { useCallback, useEffect, useReducer, useState } from "react";
import { useParams, useNavigate } from "react-router-dom"
import api from "../../services/api";
import utils from "../../services/utils";
import AppHeader from "../controls/app-header";
import ErrorSurface from "../controls/error-surface";
import NotFoundSurface from "../controls/not-found-surface";
import SurfaceLoading from "../controls/surface-loading";
import {TaskStatusObj, TaskStatusOptions} from '../tasks';
import {MdOutlineEdit} from 'react-icons/md';
import {TiDeleteOutline} from 'react-icons/ti';
import {BsPlusLg} from 'react-icons/bs';
import NewTask from "../controls/new-task";
import './styles.css';
import TimeRecordEdit from "../controls/time-record-edit";
import {ErrorToast, SuccessToast} from '../controls/toast';
import {useForm, Controller} from 'react-hook-form';
import ErrorForm from "../controls/error-form";
import DatePicker from 'react-datepicker';
import Select from "react-select";
import AnimatedTick from "../controls/animated-tick";

const LS_LOADING = 0;
const LS_LOADED = 1;
const LS_NOT_FOUND = 2;
const LS_ERROR = 3;



function HeaderTab({tabs, selIndex, onChangeSel}) {
   return <header className="jk-row-05-start margin-side-15">
      {tabs.map((itm, idx) => <button 
         key={itm} 
         className={`btn-tab${idx === selIndex ? '-sel' : ''}`} 
         onClick={() => onChangeSel(idx)}
         >{itm}</button>)}
   </header>
}

function reducerDelItems(state, action) {
   if (action.type === 'set') {
      return action.values;
   }
   if (action.type === 'append') {
      return [...state, action.value];
   }
   if (action.type === 'remove') {
      return [...state].filter((itm) => itm !== action.value);
   }

}

function TaskTrackedTime({task, onEditTime, onRefreshTasks}) {

   const [recTimes, setRecTimes] = useState({loadState: LS_LOADING, items: [], errorMessage: '', totalTime: 0});
   const [delItems, dispatchDelItems] = useReducer(reducerDelItems, []);
   const [keyRefresh, setKeyRefresh] = useState(0);

   const onDeleteItem = useCallback((item) => {
      dispatchDelItems({type: 'append', value: item.id});
      api.delete(`tasks/time-record/${item.id}`)
      .then((ret) => {
         setKeyRefresh(p => p+1);
         onRefreshTasks();
      })
      .catch((err) => {
         dispatchDelItems({type: 'remove', value: item.id});
         ErrorToast.fire({
            icon: 'error',
            title: utils.getHTTPError(err)
         });
      });

   }, [onRefreshTasks]);

   useEffect(() => {
      setRecTimes(p => ({...p, loadState: LS_LOADING}));
      const cancelToken = api.getCancelToken();
      const fetchTimes = async () => {
         try {
            const ret = await api.get(`/tasks/tracked-time-task/${task.id}`);
            setRecTimes({loadState: LS_LOADED, items: ret.data.results, errorMessage: '', totalTime: ret.data.totalTime});            
         } catch (err) {
            if (!api.isCancel(cancelToken)) {
               setRecTimes(p => ({...p, loadState: LS_ERROR, errorMessage: utils.getHTTPError(err)}));
            }
         }
      }
      fetchTimes();
      return () => cancelToken.cancel();
   }, [task.id, keyRefresh]);

   return (<>
         {
         recTimes.loadState === LS_LOADED ?
            (               
               recTimes.items.length > 0 ? 
                  (
                     <ol className="list-scroll-margin-1">
                        {
                           recTimes.items.map((itm) => <li  key={itm.id} >
                              {itm.firstFromWeek && <div className="header-week-time ">
                                 <label className="lb-75">{ utils.getWeekFromDateStr(itm.start_time)}</label>
                                 <label className="lb-card-title">{utils.formatFloatAsTime(itm.total_time_week ?? 0, false) } hrs</label>
                              </div>  }
                              <div className="item-hour-recorded">
                                 <label className="width-4 lb-75">{utils.getDayNumAndName(itm.start_time)}</label>
                                 <label className="lb-75">{`${utils.getHoursShort(itm.start_time)} - ${utils.getHoursShort(itm.end_time ?? new Date())}`}</label>
                                 <label className="lb-75">{utils.formatFloatAsTime(itm.recorded_time ?? 0, false) }</label>
                                 <div className="jk-row-05">
                                    <button className="btn-icon btn-no-shadow btn-pad-025" onClick={() => onEditTime(itm)} ><MdOutlineEdit size={16}/> </button>
                                    {delItems.indexOf(itm.id) >= 0 ?  <SurfaceLoading size={24} /> : <button className="btn-icon btn-no-shadow btn-pad-025" onClick={() => onDeleteItem(itm)} ><TiDeleteOutline size={16}/> </button>}                                    
                                 </div>
                              </div>
                           </li>)
                        }                        
                     </ol>
                  ) : <NotFoundSurface title="No times recorded yet" message="Try add a new time on the plus button below" />                              
            ) : 
            (
               recTimes.loadState === LS_ERROR ? 
                  <ErrorSurface  message={recTimes.errorMessage} /> : 
                  <SurfaceLoading />
            )
      }   
   </>
   );
   

}

function TaskEditContainer({task, onRefreshTasks}) {
   const [selTabIndex, setSelTabIndex] = useState(0);
   const [showModalTimeEdit, setShowModalTimeEdit] = useState(false);
   const [keyTrackRender, setKeyTrackRender] = useState(0);
   const [timeRecordToUpdate, setTimeRecordToUpdate] = useState(null);
   const { register, handleSubmit, control, setValue, formState: {errors}} = useForm();
   const [loadingTask, setLoadingTask] = useState(LS_LOADING);
   const [errorMessage, setErrorMessage] = useState('');
   const [timeTrackedCurr, setTimeTrackedCurr] = useState(0);
   const [saving, setSaving] = useState(false);
   const [originalTaskData, setOriginalTaskData] = useState(null);
   const [deleting, setDeleting] = useState(false);  
   const [showSuccess, setShowSuccesss] = useState(false);
   

   const setFormData = useCallback((newData) => {
      setValue('description', newData.description);
      setValue('id_task_status', TaskStatusOptions.find((itm) => itm.value === newData.id_task_status));
      setValue('due_date', newData.due_date ? new Date(newData.due_date) : '');
      setValue('estimated_time', newData.estimated_time);
      setValue('priority', newData.priority);
      setOriginalTaskData(newData);
      setTimeTrackedCurr(newData.tracked_time);
   }, [setValue]);

   useEffect(() => {
      setLoadingTask(LS_LOADING);
      setErrorMessage('');
      let cancelToken = api.getCancelToken();
      const fetchTask = async () => {
         try {
            const ret = await api.get(`/tasks/id/${task.id}`);
            const tskData = ret.data;
            setLoadingTask(LS_LOADED);
            setFormData(tskData);
            setDeleting(false);
            setSaving(false);
            setShowSuccesss(false);
         } catch (err) {
            if (!api.isCancel(err)) {
               setLoadingTask(LS_ERROR);
               setErrorMessage(utils.getHTTPError(err));
            }
         }         
      }
      fetchTask();
      return () => cancelToken.cancel();
   }, [task.id, setValue, setFormData]);


   const onCloseTimeEdit = useCallback((savedRecord) => {
      if (savedRecord) {
         setKeyTrackRender(p => p+1);        
         onRefreshTasks(); 
      }
      setShowModalTimeEdit(false);
   }, [onRefreshTasks]);

   const onRequestTimeEdit = useCallback((timeRecord) => {
      setTimeRecordToUpdate(timeRecord);
      setShowModalTimeEdit(true);
   }, [])

   const onSubmit = (data, e) => {      
      if (!saving) {         
         setSaving(true);
         setErrorMessage('');
         let taskUpd = {...data, id_task_status: data.id_task_status.value, id: task.id};
         if (!taskUpd.estimated_time && !originalTaskData.estimated_time) {
            taskUpd.estimated_time = null;
         }
         if (!taskUpd.priority && !originalTaskData.priority) {
            taskUpd.priority = null;
         }
         if (taskUpd.due_date && (typeof taskUpd.due_date !== "object" )) {
            taskUpd.due_date = null;
         }
         api.post('/tasks/', taskUpd)
         .then((ret) => {
            if (task.id === ret.data.id) {
               setSaving(false);
               setFormData(ret.data);
               setShowSuccesss(true);
               setTimeout(() => {
                  setShowSuccesss(false);
               }, 1500);
               onRefreshTasks();
            }
         })
         .catch((err) => {
            setSaving(false);
            setErrorMessage(utils.getHTTPError(err));
         });         
      }          
   }  

   const onFormError = (errors, e) => {
      console.log('errors');
      console.log(errors); 
   }

   
   const getTaskForm = () => {
      return <form onSubmit={handleSubmit(onSubmit, onFormError)} className="jk-row-05 align-start">
         <div className="jk-column-1 align-start flex-1">
            <div className="jk-column-05 align-start width-100">
               <label className="lb-75">Description</label>
               <input className={`inp-form inp-description ${errors.description ? 'inp-error' : ''}`}  {...register('description', {required: true})} />               
               <ErrorForm  error={errors.description} fieldName='Description'  />
            </div>
            <div className="jk-column-05 align-start width-100">
               <label className="lb-75">Status</label>
               <div className="jk-row-05 min-width-12">
                  <Controller 
                        name="id_task_status"
                        control={control}
                        rules={{required: true}}
                        render={ ({field}) =>  
                        <Select 
                           options={TaskStatusOptions} 
                           {...field}                                                    
                           classNamePrefix='av-select'  
                           />                                          
                     }            
                  />
               </div>
               <ErrorForm  errorMessage={errors.id_task_status} fieldName='Status'  />
            </div>
            <div className="jk-column-05 align-start">
               <label className="lb-75">Due date</label>
               <Controller 
                     name="due_date"
                     control={control}
                     render={({field: {onChange, name, value} }) =>  <DatePicker
                        className='inp-form inp-date'
                        selected={value}
                        name={name}
                        onChange={(dt) => onChange({target: {name: name, value: dt}})}
                     />}                       
                  />            
               <ErrorForm  errorMessage={errors.due_date} fieldName='Due date'  />
            </div>
            <div className="jk-column-05 align-start">
               <label className="lb-75">Estimated time (hrs)</label>
               <input step={0.01} type={'number'} className={`inp-form width-4 ${errors.estimated_time ? 'inp-error' : ''}`}  {...register('estimated_time', {valueAsNumber: true})} />
               <ErrorForm  errorMessage={errors.estimated_time} fieldName='Estimated time'  />
            </div>
            <div className="jk-column-05 align-start">
               <label className="lb-75">Priority</label>
               <input type={'number'} className={`inp-form  width-4 ${errors.priority ? 'inp-error' : ''}`}  {...register('priority', {valueAsNumber: true})} />
               <ErrorForm  errorMessage={errors.priority} fieldName='Priority'  />
            </div>            
            <div className="tsk-form-buttons">  
               <button type="submit" className={`btn-action min-width-8 `}>{saving ? <SurfaceLoading size={16} onBackground={true} /> : (showSuccess ? <AnimatedTick /> : 'Save') }</button>               
               <button className="btn-link-nopad"  id="btn-del-form" onClick={deleting ? null : handleDelete}>{deleting ? <SurfaceLoading size={16} /> : 'Delete'}</button>
            </div>                        
            {errorMessage && <ErrorSurface message={errorMessage} /> } 
         </div>
         <div className="jk-column-05 just-start">
            <div className="billbd-time">
               <div>
                  <h3>Tracked time</h3>
               </div>
               <label>{utils.formatFloatAsTime(timeTrackedCurr ?? 0, false)}</label>
            </div>
         </div>                  
      </form>
   }

   const handleDelete = useCallback((e) => {
      e.preventDefault();
      setDeleting(true);
      api.delete(`/tasks/id/${task.id}`)
      .then((ret) => {
         SuccessToast.fire(
            {
               icon: 'success',
               title: `Task successfully deleted!`
            }
         );
         onRefreshTasks(true);
      })
      .catch((err) => {
         setDeleting(false);
         ErrorToast.fire(
            {
               icon: 'error',
               title: `The task didn't could be deleted!`,
               text: utils.getHTTPError(err)
            }
         );         
      });
            
   }, [onRefreshTasks, task.id]);

   return <section className="tsk-edit-container">

      <div className="header-tsk-edit">
         <div className="jk-column-1 align-start">
            <label className="title-tsk-edit">{task.description}</label>
            <label className="lb-75">{TaskStatusObj[task.id_task_status]}</label>
         </div>
         <div className="jk-row-05">
            <button className="btn-link min-width-8" id="btn-del-tsk-top" onClick={deleting ? null : handleDelete}>{deleting ? <SurfaceLoading size={16} /> : 'Delete'}</button>
         </div>
      </div>      
      <HeaderTab  tabs={['Details', 'Tracked time']}   selIndex={selTabIndex} onChangeSel={(idx) =>  setSelTabIndex(idx)}  />
      <section className="tsk-content-client">
         {
            selTabIndex === 0 ? 
               (
                  loadingTask === LS_LOADING ? <SurfaceLoading /> : 
                     (
                        loadingTask === LS_LOADED ? getTaskForm() : 
                        (
                           loadingTask === LS_ERROR ? <ErrorSurface message={errorMessage} /> : 
                              <NotFoundSurface title="Task not found" message="Verify the selected task" />
                        )
                     )
               ) : 
               <>
                  <TaskTrackedTime  task={task} key={keyTrackRender}  onEditTime={onRequestTimeEdit} onRefreshTasks={onRefreshTasks} />            
                  <button className="btn-plus" onClick={() => onRequestTimeEdit(null) } > <BsPlusLg size={16}/> </button>
                  <TimeRecordEdit show={showModalTimeEdit}  idTask={task.id} onCloseModal={onCloseTimeEdit} timeRecord={timeRecordToUpdate}  />
               </>               
         }         
      </section>
   </section>
}

function TaskListItem({task, onClick, isSelected}) {   

   const onClickItem = useCallback(() => {
      onClick(task);
   }, [task, onClick]);

   return <li 
         className={`card-primary card-task-item${task.id_task_parent ? '-child' : ''}  ${isSelected ? 'card-task-sel' +  (task.id_task_parent ? '-child' : '')   : ''} `}  
         onClick={onClickItem} >
      <div className="jk-row-05 width-100">
         <label className="lb-card-title">{task.description}</label>
         <label className="task-hour">{utils.formatFloatAsTime(task.tracked_time, false)} </label>
      </div>
      <div className="jk-row-05 width-100">
         <label className="lb-75">{TaskStatusObj[task.id_task_status]}</label>
         {task.estimated_time && <label className="lb-75">Estimated: {utils.formatFloatAsTime(task.estimated_time, false)} </label>} 
      </div>
   </li>

}

function TaskSummary({summaryData}) {
   return <section className="card-primary">
      <div className="jk-row-05 width-100">
         <label className="lb-card-title">Total</label>
         <label className='task-hour'>{utils.formatFloatAsTime(summaryData.tracked, false)} </label>
      </div>
      <div className="jk-row-05 width-100">
         <label className="lb-75" >Estimated:</label>
         <label >{utils.formatFloatAsTime((summaryData.estimated ?? 0) / 24, false)} </label>
      </div>
      {
         (summaryData.estimated > 0 && summaryData.tracked) &&
         (
            <div className="jk-row-05 width-100">
               <label className="lb-75" >Difference:</label>
               <label >{utils.formatFloatAsTime(summaryData.tracked - ((summaryData.estimated ?? 0) / 24), false)} ({ Math.round((summaryData.tracked / ((summaryData.estimated ?? 0) / 24)) * 100)}% from estimated) </label>
            </div>
         ) 
      }      
   </section>
}

const customStyleTaskOptions = {
   option: (provided, state) => ({
      ...provided,
      paddingLeft: state.data.id_task_parent ? 32 : 16,
      fontWeight: state.data.id_task_parent? 'normal' : 'bold',
      borderBottom: state.data.id_task_parent ? '' : '1px solid #FFF'
   })
}

export default function TaskEdit(props) {

   const {taskCode} = useParams();
   const [loadState, setLoadState] = useState(LS_LOADING);
   const [taskData, setTaskData] = useState(null);
   const [errorMessage, setErrorMessage]  = useState('');
   const [selTaskId, setSelTaskId] = useState(null);
   const [addingNew, setAddingNew] = useState(false);
   const [keySideRefresh, setKeySideRefresh] = useState(null);
   const [selTask, setSelTask] = useState(null);
   const [keySelectTask, setKeySelectTask] = useState(0);
   let navigate = useNavigate();

   useEffect(() => {
      document.title = 'Task edit - JkTracker';
   }, []);   

   useEffect(() => {
      if (taskData && selTaskId) {
         setSelTask(taskData.results.find((itm ) => itm.id === selTaskId));
         setKeySelectTask(p => p +1);
      } else {
         setSelTask(null);
      }      
   }, [selTaskId, taskData])

   useEffect(() => {
      const cancelToken = api.getCancelToken();
      const fetchTaskItems = async () => {
         try {
            const ret = await api.get(`/tasks/code/${taskCode}`);
            setSelTaskId(p => {
               if (p) {
                  if (ret.data.results.find((itm) =>  itm.id === p)) {
                     return p;
                  }                  
               }                          
               const idxSel = ret.data.results.findIndex((itm) => itm.unique_code === taskCode);
               if (idxSel >= 0) {
                  return ret.data.results[idxSel].id;
               }
               return ret.data.results[0].id;                        
            });
            ret.data.results = ret.data.results.map((itm) => ({...itm, value: itm.id, label: itm.description}));
            setTaskData(ret.data);            
            setLoadState(LS_LOADED);            
         } catch (err) {
            if (!api.isCancel(err)) {
               if (err.response) {
                  if (err.response.status === 404) {
                     if (keySideRefresh && keySideRefresh.afterDelete) {                        
                        navigate('/tasks');
                        return;
                     }
                     setLoadState(LS_NOT_FOUND);
                     return;
                  }                  
               }
               setLoadState(LS_ERROR);
               setErrorMessage(utils.getHTTPError(err));
            }
         }
      }
      fetchTaskItems();
      return () => cancelToken.cancel();
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [taskCode, keySideRefresh]);

   const onClickTask = useCallback((item) => {
      setSelTaskId(item.id);
   }, []);

   const onCloseAddTask = useCallback((newTask) => {
      setAddingNew(false);
      if (newTask) {
         setTaskData(p => ({...p, results: [...p.results, {...newTask, value: newTask.id, label: newTask.description}]}));
         setSelTaskId(newTask.id);
      }
   }, []);

   return <div className="task-edit-content">
      <AppHeader />
      {
         loadState === LS_NOT_FOUND ? 
            <NotFoundSurface title="Task not found!"  message="Please verify the selected task." /> : 
            (
               loadState === LS_ERROR ? 
                  <ErrorSurface message={errorMessage} /> :
                  (
                     loadState === LS_LOADING ? 
                        <SurfaceLoading /> : 
                        (
                           loadState === LS_LOADED &&
                              (
                                 <div className="flex-1 just-center">
                                    <section className="tsk-edit-body">
                                       <section className="task-sect-mob jk-column-05 align-start pad-1">
                                          <label>Task Edit</label>
                                          <div className="parent-select-100 parent-select-form">
                                             <Select
                                                classNamePrefix='av-select'   
                                                options={taskData.results}                                                
                                                key={keySelectTask}
                                                defaultValue={selTask}
                                                onChange={(opt) => setSelTaskId(opt.value)}
                                                styles={customStyleTaskOptions}                                                
                                             />
                                          </div>                                          
                                          <div className="jk-row-05 just-end width-100">
                                             <button className="btn-link" onClick={() => setAddingNew(true)} >Add New</button>
                                          </div>
                                       </section>
                                       <aside className="jk-column-flex-1 a-task-list ">                                          
                                          <div className="flex-1 max-height-100-5625 pos-relative">
                                             <ol className="list-scroll">
                                                {
                                                   taskData?.results.map((itm) => <TaskListItem  task={itm} key={itm.id} onClick={onClickTask} isSelected={selTaskId === itm.id} /> )
                                                }
                                             </ol>
                                          </div>
                                          <button className="btn-plus margin-bt-65" onClick={() => setAddingNew(true)} > <BsPlusLg size={16}/> </button>
                                          <NewTask 
                                             onCloseModal={onCloseAddTask}
                                             show={addingNew}
                                             parentTask={taskData.results[0]}
                                          />     
                                          <TaskSummary  summaryData={taskData.total} />
                                       </aside>
                                       <TaskEditContainer task={selTask}  onRefreshTasks={(afterDelete) => setKeySideRefresh({afterDelete: afterDelete})} />
                                       <section className="task-sect-mob jk-row-05 width pad-1">
                                          <TaskSummary  summaryData={taskData.total} />
                                       </section>
                                    </section>                                 
                                 </div>

                              )
                        )
                  )
            )
      }

      
   </div>;

}