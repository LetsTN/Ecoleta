import axios from 'axios';

const api = axios.create({
    // put your IPv4 address here:
    baseURL: 'http://192.168.25.237:3333/',
});

export default api;