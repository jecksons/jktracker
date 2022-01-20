import './styles.css';
import PropTypes from 'prop-types';


function ErrorForm({error, fieldName = null}) {

   if (error) {
      console.log(error);
      return <p className='error-message'>
         {error.message !== '' ?  error.message  : 
            {
               'required': `${fieldName ? fieldName : 'This field' } is required!`,
               'min': `${fieldName ? fieldName : 'This field' } is required (min. value)!`
            }[error.type]         
         }
      </p>;
   } else return null;
}

ErrorForm.propTypes = {
   error: PropTypes.object,
   fieldName: PropTypes.string
}

export default ErrorForm;