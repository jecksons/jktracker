function Config(){
    const API_URL = process.env.REACT_APP_API_URL;
    const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
   
   let cfgBase = {        
        apiURL: API_URL,
        googleClientId: GOOGLE_CLIENT_ID
   };

   return cfgBase;
}

export default new Config();