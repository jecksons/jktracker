import { useCallback, useEffect, useState } from "react";
import {useNavigate} from 'react-router-dom';
import api from "../../services/api";
import utils from "../../services/utils";
import AppHeader from "../controls/app-header";
import {AiOutlineDown, AiOutlineUp} from 'react-icons/ai';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import './styles.css';
import SurfaceLoading from "../controls/surface-loading";
import NotFoundSurface from '../controls/not-found-surface';
import { useSessionStorage } from "../../hooks/utils-hooks";



function DayTracked({dayData}) {
   const [isExpanded, setIsExpanded] = useState(false);
   const navigate = useNavigate();

   return (
      <li  className='card-day'>
      <div className="card-day-header">
         <h2>{utils.getDayName(dayData.date)}</h2>
         <h4>{utils.getDayMonth(dayData.date)}</h4>
         <button className="btn-icon btn-expand-day" onClick={() => setIsExpanded(p => !p)} >
         {isExpanded ? 
            <AiOutlineUp size={16} />  : 
               <AiOutlineDown size={16} /> 
               
            }
         </button>
      </div>
      <ul className={`task-items${isExpanded ? '' : '-collapsed'}`} >
         {
            dayData.tasks.map((tsk) => <li className="card-day-task-item" key={tsk.id} onClick={() => navigate(`/tasks/edit/${tsk.unique_code}`)} >
                  <p>{tsk.description}</p>
                  <h4>{utils.formatDecimalHours(tsk.hours)}</h4>
            </li>)
         }
      </ul>      
      <div className="card-day-footer">
         <h3>{utils.formatDecimalHours(dayData.totalHours)}</h3>
      </div>
   </li>
   )

}


export default function TimeTracking(props) {

   const [weekDate, setWeekDate] = useSessionStorage('tracking-seldate', new Date(), true);
   const [qrResult, setQrResult] = useState(null);
   const [loadingItems, setLoadingItems] = useState(false);

   useEffect(() => {
      document.title = 'Time Tracking - Jktracker';
   }, []);

   const handleSearch = useCallback((searchDate) => {
      const fetchItm = async () => {
         try {
            const strFilter = searchDate ? `?weekFrom=${utils.getDateToURLParam(searchDate)}` : '';
            const ret = await api.get(`tasks/tracked-time/${strFilter}`);
            let dtRes = ret.data;
            dtRes.period.fromDt = new Date(dtRes.period.from);
            dtRes.period.toDt = new Date(dtRes.period.to);            
            setQrResult(dtRes);
            setLoadingItems(false);
            if (!searchDate) {
               setWeekDate(dtRes.period.fromDt);
            }
         }
         catch (err) {
            if (!api.isCancel(err)) {
               console.log(err);
            }
         }
      };
      setLoadingItems(true);
      fetchItm();
   }, [setWeekDate]);

   useEffect(() => {
      let searchDate;
      if (weekDate) {
         if (utils.getDateStr(weekDate) !== utils.getDateStr(new Date())) {
            searchDate = weekDate;
         }
      }
      handleSearch(searchDate);
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);



   return (
      <div className="parent-body-track" >
         <AppHeader selOption={'tracking'}  />         
         <div className="main-content-track">
            <section className="jk-row-05 header-track flex-wrap">
               <h1>Time Tracking</h1>
               <div className="jk-row-05">
                  <label className="lb-75">Selected week</label>
                  <DatePicker
                     id="week-select"
                     className='inp-form'
                     selected={weekDate}
                     onChange={(dt) => {
                        setWeekDate(dt);
                        handleSearch(dt);
                     }}
                  />
               </div>
            </section>
            {
               loadingItems ? 
                  <div className="results-loading">
                     <SurfaceLoading />                     
                  </div> : 
                  (
                     qrResult && (
                        qrResult.days.length > 0  ?
                           (
                              <div className="jk-column-05 width-100 tracking-data">
                                 <section className="jk-row-05 width-100 week-stats">
                                    <label>{`${utils.getDateStr(qrResult.period.fromDt)} to ${utils.getDateStr(qrResult.period.toDt)}`}</label>
                                    <label>{`Total hours: ${utils.formatDecimalHours(qrResult.totalHours ?? 0)}`}</label>
                                 </section>
                                 <ol className="days-list">
                                    {qrResult.days.map((itm) => <DayTracked key={itm.date}  dayData={itm} /> )}
                                 </ol>   
                              </div>
                           ) : 
                           <NotFoundSurface title="There are no records for the selected week." message="Try to register times to show data here." />

                        
                     )
                  )
            }          
         </div>
      </div>
   );
}