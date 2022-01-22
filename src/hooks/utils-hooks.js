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

function getSessionStorageValue(key, defaultValue, isDate) {
   let strItem = sessionStorage.getItem(key);
   if (strItem) {      
      if (isDate) {
         strItem = strItem.replaceAll('"', '');
         return new Date(strItem);
      }
      return JSON.parse(strItem) || defaultValue;
   }
   return defaultValue;
}

export function useSessionStorage(key, defaultValue, isDate) {
   const [value, setValue] = useState(() => getSessionStorageValue(key, defaultValue, isDate));

   useEffect(() => {
      sessionStorage.setItem(key, JSON.stringify(value));
   }, [key, value]);

   return [value, setValue];

}