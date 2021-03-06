import {useEffect, useState} from 'react';
import Modal from 'react-modal';
import api from '../../../services/api';
import utils from '../../../services/utils';
import SurfaceLoading from '../surface-loading';
import PropTypes from 'prop-types';

function NewTask({parentTask, show, onCloseModal}) {

   const [description, setDescription]  = useState('');
   const [saving, setSaving] = useState(false);
   const [errorMessage, setErrorMessage] = useState('');

   useEffect(() => {
      if (show) {
         setDescription('');
         setErrorMessage('');
         setSaving(false);
      }

   }, [show]);

   const onClose = () => {
      if (!saving) {
         onCloseModal();
      }      
   };

   const onSave = () => {
      setSaving(true);
      let newTask = {
         description: description            
      };
      if (parentTask) {
         newTask.id_task_parent = parentTask.id;
      }
      api.post('/tasks/', newTask)
      .then((ret) => onCloseModal(ret.data))
      .catch((err) => {
         setErrorMessage(utils.getHTTPError(err));
         setSaving(false);
      });      
   }


   if (show) {
      return <Modal 
         isOpen={true}
         onRequestClose={onClose}
         overlayClassName={'overlay-dialog'}
         className={'dialog-content'} >
         <section className='modal-content jk-column-05'>
            <label className='modal-title'>New Task</label>
            {
               parentTask && 
                  (
                     <div className='jk-column-05 modal-header'>
                        <h3>Parent</h3>
                        <h4>{parentTask.description}</h4>
                     </div>                     
                  )
            }            
            <div className='modal-start'>
               <label className='inp-form'>Description</label>
               <input 
                  className='inp-form task-description'  
                  value={description} 
                  autoFocus={true}
                  maxLength={500}
                  placeholder='Task description'
                  onChange={(e) => setDescription(e.target.value)} />
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


NewTask.propTypes = {   
   show: PropTypes.bool,
   onCloseModal: PropTypes.func.isRequired
}


export default NewTask;