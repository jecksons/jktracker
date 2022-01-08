export default function Config(){
   let env = process.env.NODE_ENV || 'development';

   const API_URL = process.env.REACT_APP_API_URL;
  
   const dev_prod = process.env.REACT_APP_DEV_PROD || 'N';    

   if (dev_prod === 'Y') {        
       env = 'production';
       console.log('Dev environment manually changed to production.');
   };


   const cfgBase = {        
       development: {
           apiURL: API_URL ?? 'http://localhost:9000',
           original_env: env
       },
       production: {
           apiURL: API_URL ?? 'https://avoki-a-be.herokuapp.com',
           original_env: env
       }
   };
   console.log('api 2: ');
   console.log(API_URL);

   return cfgBase[env];
}