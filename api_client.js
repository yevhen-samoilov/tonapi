const axios = require('axios');

const post = async (endpoint, body) => {
    return await axios.post(endpoint, body)
        .then((response) => {
            const data = response.data;
            console.error(data);
            return data;
        })
        .catch((error) => {
            console.error(error);
            return `${error}`;
        });
}

const get = async (endpoint) => {
    return await axios.get(endpoint)
        .then((response) => {
            const data = response.data;
            console.error(data);
            return data;
        })
        .catch((error) => {
            console.error(error);
            return `${error}`;
        });
}

const client = {
    post: post,
    get: get
}

module.exports = {
    client: client
};
