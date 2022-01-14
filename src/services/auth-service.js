import api from "./api";
import TokenService from "./token-service";
import { createBrowserHistory } from 'history';

class AuthService {

   static async loginDemo() {
      let ret = await api.get('auth/signin-demo/');
      TokenService.updateLocalUser(ret.data);      
   }

   static logout() {
      TokenService.deleteLocalUser();
      createBrowserHistory().push('/');
      window.location.reload();
   }

   static async loginEmail(username, email) {
      let ret = await api.post('auth/signin-email', {
         description: username,
         email: email
      });
      TokenService.updateLocalUser(ret.data);
   }


}

export default AuthService;