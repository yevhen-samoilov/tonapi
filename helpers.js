
const METHODS = {
    get: 'get',
    post: 'post',
    put: 'put',
};

function handler(fn, e) {
    return async function (...args) {
        try {
            return await fn(...args);
        } catch (error) {
            console.error("An error occurred:", error);
            return { 'ERROR': `${e}: ${error}` ?? `${error}` };
        }
    };
}

module.exports = {
    METHODS: METHODS,
    handler: handler
}