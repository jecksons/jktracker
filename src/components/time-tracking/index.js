import { useEffect, useState } from "react";
import api from "../../services/api";
import utils from "../../services/utils";
import AppHeader from "../controls/app-header";
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import './styles.css';
import SurfaceLoading from "../controls/surface-loading";


export default function TimeTracking(props) {

   const [weekDate, setWeekDate] = useState(new Date());
   const [qrResult, setQrResult] = useState(null);
   const [loadingItems, setLoadingItems] = useState(false);


   useEffect(() => {
      document.title = 'Time Tracking - Jktracker';
   }, []);

   useEffect(() => {
      const cancelToken = api.getCancelToken();
      const fetchItm = async () => {
         try {
            const ret = await api.get(`tasks/tracked-time/?weekFrom=${utils.getDateToURLParam(weekDate)}`);
            let dtRes = ret.data;
            dtRes.period.fromDt = new Date(dtRes.period.from);
            dtRes.period.toDt = new Date(dtRes.period.to);
            setQrResult(dtRes);
            setLoadingItems(false);
         }
         catch (err) {
            if (!api.isCancel(err)) {
               console.log(err);
            }
         }

      };
      setLoadingItems(true);
      fetchItm();
      return () => cancelToken.cancel();
   }, [weekDate]);



   return (
      <div className="parent-body-track" >
         <AppHeader />         
         <div className="main-content-track">
            <section className="jk-row-05 header-track">
               <h1>Time Tracking</h1>
               <div className="jk-row-05">
                  <label>Selected week</label>
                  <DatePicker
                     id="week-select"
                     selected={weekDate}
                     onChange={(dt) => setWeekDate(dt)}
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
                        <div className="jk-column-05 width-100 tracking-data">
                           <section className="jk-row-05 width-100 week-stats">
                              <label>{`${utils.getDateStr(qrResult.period.fromDt)} to ${utils.getDateStr(qrResult.period.toDt)}`}</label>
                              <label>{`Total hours: ${utils.formatDecimalHours(qrResult.totalHours)}`}</label>
                           </section>
                           <ol className="days-list">
                              {qrResult.days.map((itm) => <li key={itm.date} className='card-day'>
                                 <div className="card-day-header">
                                    <h2>{utils.getDayName(itm.date)}</h2>
                                    <h4>{utils.getDayMonth(itm.date)}</h4>
                                 </div>
                                 <ul className="task-items">
                                    {
                                       itm.tasks.map((tsk) => <li className="card-day-task-item" key={tsk.id}>
                                             <p>{tsk.description}</p>
                                             <h4>{utils.formatDecimalHours(tsk.hours)}</h4>
                                       </li>)
                                    }
                                 </ul>
                                 <div className="card-day-footer">
                                    <h3>{utils.formatDecimalHours(itm.totalHours)}</h3>
                                 </div>
                              </li>)}
                           </ol>
   
                        </div>
                     )
                  )
            }          
         </div>
      </div>
   );
}