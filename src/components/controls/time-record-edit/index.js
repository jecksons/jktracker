import {useCallback, useEffect, useState} from 'react';
import Modal from 'react-modal';
import api from '../../../services/api';
import utils from '../../../services/utils';
import SurfaceLoading from '../surface-loading';
import PropTypes from 'prop-types';
import DatePicker from 'react-datepicker';
import './styles.css';


function TimeRecordEdit({idTask, show, onCloseModal, timeRecord}) {

   const [editRecord, setEditRecord] = useState({
      startDate: new Date(),
      startHour: utils.getHoursShort(new Date()),
      endDate: new Date(),
      endHour: utils.getHoursShort(new Date()),
   });
   const [saving, setSaving] = useState(false);
   const [errorMessage, setErrorMessage] = useState('');
   const [computedDates, setComputedDates] = useState(null);

   const onEditChange = useCallback((target) => {
      setEditRecord(p => ({...p, [target.name]: target.value }));
   }, []);

   useEffect(() => {
      let newTotalTime = 0;
      let startTime;
      let endTime;
      if (editRecord) {
         if (editRecord.startDate &&  editRecord.endDate) {
            let tmpTime = utils.getTimeStrToTime(editRecord.startHour);
            startTime = new Date(editRecord.startDate.getFullYear(),  
                  editRecord.startDate.getMonth(), 
                  editRecord.startDate.getDate(), 
                  (tmpTime ? tmpTime.hour : 0), 
                  (tmpTime ? tmpTime.minute : 0));
            tmpTime = utils.getTimeStrToTime(editRecord.endHour);
            endTime = new Date(editRecord.endDate.getFullYear(),  
                  editRecord.endDate.getMonth(), 
                  editRecord.endDate.getDate(), 
                  (tmpTime ? tmpTime.hour : 0), 
                  (tmpTime ? tmpTime.minute : 0));         
            newTotalTime = ((endTime.getTime() - startTime.getTime()) / 1000 / 60 / 60 / 24);
            if (newTotalTime < 0) {
               newTotalTime = 0;
            }
         }

      }      
      setComputedDates({totalTime: newTotalTime, startTime: startTime, endTime: endTime})
   }, [editRecord]);

   useEffect(() => {
      if (show) {
         setErrorMessage('');
         setSaving(false);
         if (timeRecord) {
            const dtStartOri = new Date(timeRecord.start_time);
            const dtEndOri = new Date(timeRecord.end_time);
            setEditRecord({
               startDate: dtStartOri,
               startHour: utils.getHoursShort(dtStartOri),
               endDate: dtEndOri,
               endHour: utils.getHoursShort(dtEndOri),
            });
         } else {
            setEditRecord({
               startDate: new Date(),
               startHour: utils.getHoursShort(new Date()),
               endDate: new Date(),
               endHour: utils.getHoursShort(new Date()),
            });
         }
      }

   }, [show, timeRecord]);

   const onClose = () => {
      if (!saving) {
         onCloseModal();
      }      
   };

   const onSave = useCallback(() => {
      if (!computedDates) {
         setErrorMessage('Please inform the start and end time!');
         return;
      }
      if (!computedDates.startTime || !computedDates.endTime) {
         setErrorMessage('Please inform the start and end time!');
         return;
      }
      setErrorMessage('');
      setSaving(true);
      let newTimeRec = {
         id_task: idTask,
         start_time: computedDates.startTime,
         end_time: computedDates.endTime
      };               
      if (timeRecord) {
         newTimeRec.id = timeRecord.id;
      }
      api.post('/tasks/time-record/', newTimeRec)
      .then((ret) => onCloseModal(ret.data))
      .catch((err) => {
         setErrorMessage(utils.getHTTPError(err));
         setSaving(false);
      });      
   }, [computedDates, idTask, onCloseModal, timeRecord]);


   if (show) {
      return <Modal 
         isOpen={true}
         onRequestClose={onClose}
         overlayClassName={'overlay-dialog'}
         className={'dialog-content'} >
         <section className='modal-content jk-column-05'>
            <label className='modal-title'>{timeRecord ? 'Editing Time Record' : 'New Time Record'}</label>     
            <div className='modal-start'>
               <div className='jk-column-1 back-color-4 pad-1'>
                  <div className='jk-column-05 align-start'>
                     <label className='lb-75'>Start time</label>
                     <div className='jk-row-05 align-end'>
                        <DatePicker
                           id="start-date"
                           className='inp-form inp-date'
                           selected={editRecord.startDate}
                           onChange={(dt) => onEditChange({name: 'startDate', value: dt})}
                        />
                        <input type="time" 
                           placeholder='hh:mm (24h format)'
                           value={editRecord.startHour}
                           className='min-width-5 inp-form'
                           name='startHour'
                           onChange={(e) => onEditChange(e.target)}
                        />
                     </div>
                  </div>
                  <div className='jk-column-05  align-start'>
                     <label className='lb-75'>End time</label>
                     <div className='jk-row-05 align-end'>
                        <DatePicker
                           id="end-date"
                           className='inp-form inp-date'
                           selected={editRecord.endDate}
                           onChange={(dt) => onEditChange({name: 'endDate', value: dt})}
                        />
                        <input type="time" 
                           placeholder='hh:mm (24h format)'
                           value={editRecord.endHour}
                           className='min-width-5 inp-form'
                           name='endHour'
                           onChange={(e) => onEditChange(e.target)}
                        />
                     </div>
                  </div>                                    
               </div>
               <div className='jk-row-05 tot-hours-edit'>
                  <label className='lb-75'>Total:</label>
                  <label className='lb-card-title'>{utils.formatFloatAsTime(computedDates ? computedDates.totalTime : 0, false)} </label>
               </div>
            </div>
            { errorMessage !== ''  &&
               <p className='error-message'>{errorMessage}</p>
             }
            <div className='confirm-buttons'>
               <button className='btn-action min-width-8' onClick={onSave}>
                  {saving ?
                     <SurfaceLoading size={16} onBackground={true} /> : 
                     'Save'
                  }
               </button>
               <button className='btn-link' onClick={onClose} >
                  Cancel
               </button>
            </div>
         </section>           
      </Modal>

   } else 
      return null;
}


TimeRecordEdit.propTypes = {   
   idTask: PropTypes.number.isRequired,
   show: PropTypes.bool.isRequired,
   onCloseModal: PropTypes.func.isRequired,
   timeRecord: PropTypes.object
}


export default TimeRecordEdit;