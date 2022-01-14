import {useEffect, useState} from 'react';
import TokenService from '../services/token-service';

export function useCurrUser() {

   const [userInfo, setUserInfo] = useState(null);
   

   useEffect(() => {
      let info = TokenService.getLocalUser();
      if (info) {
         if (info.description) {
            const names = info.description.split(' ');
            info.firstName = names.length > 0 ? names[0] : info.description;
         }
      }
      setUserInfo(info);
   }, []);

   return userInfo;
}
