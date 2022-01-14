import './styles.css';
import {useCallback, useState} from 'react';
import { useCurrUser}  from '../../../hooks/utils-hooks';
import AuthService from '../../../services/auth-service';


export default function LogoutButton(props) {

   const currUser = useCurrUser();
   const [isHover, setIsHover] = useState(false);

   const handleClick = useCallback(() => {
      AuthService.logout();
   }, []);

   return <div className='jk-row-top' >
      <button className='btn-logout'  
         onMouseEnter={() => setIsHover(true)}
         onMouseLeave={() => setIsHover(false)}
         onClick={handleClick}
      >
         {isHover ? 'Logout' : `Hi, ${currUser?.firstName}!`}
      </button>
      <div className='jk-column-05 align-start div-logout-mob'>
         <label>Hi, {currUser?.firstName}!</label>
         <button className='btn-link-nopad' onClick={handleClick}>Logout</button>
      </div>
   </div>;

}