class Utils {

   getHTTPError(error) {
       if (error.response) {
           // The request was made and the server responded with a status code
           // that falls out of the range of 2xx
           if (error.response.data) {
               if (error.response.data.error)
                   return error.response.data.error;
               if (error.response.data.message)
                   return error.response.data.message;
               return error.response.data;
           }
         }
       return error.message;
   }

   getDateToURLParam(dt) {        
       return `${dt.getFullYear()}-${(dt.getMonth()+1).toString().padStart(2, '0')}-${dt.getDate().toString().padStart(2, '0')}`;
   }

   getDateToStrShow(dt) {
       let dtDate = dt;
       if (typeof dtDate === 'string') {
           dtDate = new Date(dtDate);
       }
       return `${dtDate.getDate().toString().padStart(2, '0')}/${(dtDate.getMonth()+1).toString().padStart(2, '0')}/` + 
           `${dtDate.getFullYear().toString()}, ${dtDate.getHours().toString().padStart(2, '0')}:${dtDate.getMinutes().toString().padStart(2, '0')}`;
   }

   getFloatFromStr(value) {
       if (typeof value === 'number') return value;
       if (typeof value === 'string') {
           return parseFloat(value.replace(',',''));           
       }
       return 0;
   }

   redirectToErrorPage(history, err) {        
       if (err.response) {
           if (err.response.status === 404)  {                
                                
              history.replace(`/notfound/?requestedURL=${history.location ? history.location.pathname : ''}`);
              return;
           }
        }
        history.replace(`/unknown-error/?requestedURL=${history.location ? history.location.pathname :  ''}&message=${this.getHTTPError(err)}`);
   }   

   formatFloatAsTime(value) {      
      const hrs = Math.trunc(value * 24);
      const mins = Math.trunc((value -(hrs / 24)) * 24 * 60);
      const secs = Math.trunc( (value - (hrs/ 24 ) - (mins / 60 / 24 ) ) * 24 * 60 * 60);
      return hrs.toString().padStart(2, '0') + ':' + mins.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0');
   }

    formatDecimalHours(value) {
        let str = Math.trunc(value).toString().padStart(2, '0') + ':';
        str += Math.trunc((value - Math.trunc(value)) * 60).toString().padStart(2, '0');
        return str;
    }

    getDateStr(dt) {
        return  dt.getDate().toString().padStart(2, '0') + '/' + 
            (dt.getMonth() +1).toString().padStart(2, '0') + '/' + 
            (dt.getFullYear().toString());
    }

    getStrToDate(strDate) {
        const dtParts = strDate.split('/');
        if (dtParts.length === 3) {
            const day = parseInt(dtParts[0]);
            const month = parseInt(dtParts[1]);
            const year = parseInt(dtParts[2]);
            if (day >= 1 && day <= 31) {
                if (month >= 1 && month <= 12 ) {
                    if (year.toString().length === 4) {                       
                        return new Date(year, month-1, day);
                    }
                }
            }
        }
        return null;    
   }
   
   
    getDayName(dt) {
       let dtDay = dt;
       if (typeof dt === 'string') {
           dtDay = new Date(dt);
       }
       return dtDay.toLocaleDateString('default', {weekday: 'long'});
    }

    getDayMonth(dt) {
        let dtDay = dt;
        if (typeof dt === 'string') {
            dtDay = new Date(dt);
        }
        return dtDay.getDate().toString().padStart(2, '0') + '/' + dtDay.toLocaleDateString('default', {month: 'short'});
     }

}

export default new Utils();