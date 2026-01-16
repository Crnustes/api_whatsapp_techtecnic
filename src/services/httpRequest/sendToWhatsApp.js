import axios from 'axios';
import config from '../../config/env.js';

const sendToWhatsApp = async (data) => {
    const baseUrl = `${config.BASE_URL}/${config.API_VERSION}/${config.BUSINESS_PHONE}/messages`;
    const headers = {
        Authorization: `Bearer ${config.API_TOKEN}`,
    };
    try {
        const response = await axios({
            method: 'POST',
            url: baseUrl,
            headers: headers,
            data,
        });
        return response.data;
    } catch (error) {
        // Log compacto para evitar spam y facilitar debug
        const status = error?.response?.status;
        const detail = error?.response?.data || error.message;
        console.error('WhatsApp API error', { status, detail });
        throw error;
    }
};

export default sendToWhatsApp;
