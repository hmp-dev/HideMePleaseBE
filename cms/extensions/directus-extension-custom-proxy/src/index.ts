import { defineEndpoint } from '@directus/extensions-sdk';
import axios from 'axios';

export default defineEndpoint((router, { env: { CUSTOM_ENV_BACKEND_URL } }) => {
	router.post('', async (req, res) => {
		try {
			const { url } = req.body;
			const response = await axios.get(`${CUSTOM_ENV_BACKEND_URL}${url}`);
			res.json(response.data);
		} catch (e) {
			console.log(e);
			res.json([]);
		}
	});
});
