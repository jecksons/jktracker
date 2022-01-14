import axios from 'axios';
import apiConfig from './config';
import TokenService from './token-service';
import { createBrowserHistory } from 'history';

const api = axios.create({
    baseURL: apiConfig.apiURL
});

api.getCancelToken = () => axios.CancelToken.source();

api.isCancel = (err) => axios.isCancel(err);

api.interceptors.request.use(
    (config) => {
        const token = TokenService.getLocalAccessToken();
        if (token) {
            config.headers['x-access-token'] = token;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);        
    }
);

api.interceptors.response.use(
    (res) => {
        return res;
    },
    async (err) => {
        const oriConfig = err.config;
        if (err.response) {
            if (err.response.status === 401) {
                if (!oriConfig._retry) {
                    const refreshToken = TokenService.getLocalRefreshToken();
                    if (refreshToken) {
                        try {
                            const retRef = await api.post('/auth/refresh-token/', {
                                refreshToken: refreshToken
                            });
                            TokenService.updateLocalAccessToken(retRef.data.accessToken);
                            return api(oriConfig);
                        } catch (error) {                        
                        }                                                            
                    }    
                }
                TokenService.deleteLocalUser();
                createBrowserHistory().push('/#login-action');
                window.location.reload();
            }            
        }
        return Promise.reject(err);
    }
)

export default api;