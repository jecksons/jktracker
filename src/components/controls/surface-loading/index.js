import './styles.css';
import ReactLoading from 'react-loading';
import PropTypes from 'prop-types';

function SurfaceLoading({size, onBackground}) {
   return (
      <div className='parent-loading-status-onsurface'>
         <ReactLoading type="spin" color={onBackground ? "#1B264F" : "#ffffff" }   width={size > 0 ? size : 36 }  height={size > 0 ? size : 36 } /> 
      </div>
   );
}

SurfaceLoading.propTypes = {
   size: PropTypes.number,
   onBackground: PropTypes.bool
}

export default SurfaceLoading;