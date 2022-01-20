import PropTypes from 'prop-types';

function ErrorSurface({message}) {
   return <div className='error-surface'>
      <strong>
         {message}
      </strong>
   </div>;
}

ErrorSurface.propTypes = {
   message: PropTypes.string
}

export default ErrorSurface;