import axios from 'axios';
import Config from './config';

const api = axios.create({
    baseURL: Config().apiURL
});

api.getCancelToken = () => axios.CancelToken.source();

api.isCancel = (err) => axios.isCancel(err);

export default api;