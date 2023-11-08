const express = require('express');
const cors = require('cors');

const app = express();
const port = 3404;

app.use(cors({ origin: '*' }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const defaultMap = (data) => ({ 'status': 'ok', data });
const errorMap = (data) => ({ 'status': 'error', 'error': data });

const responseSend = (res, map) => {
    res.json(defaultMap(map));
};

const responseSendError = (res, error) => {
    console.error(error);
    let message = error.message;
    // Если это ошибка Axios, то обработать ее отдельно
    if (error.response && error.response.data) {
        message = error.response.data.message || error.response.data.error || message;
    }
    res.status(500).json(errorMap(message));
};

const get = (route, responseFun) => {
    app.get(route, async (req, res, next) => {
        try {
            const map = await responseFun(req.query);
            responseSend(res, map);
        } catch (error) {
            next(error);
        }
    });
};

const post = (route, responseFun) => {
    app.post(route, async (req, res, next) => {
        try {
            const map = await responseFun(req.body, { headers: req.headers });
            responseSend(res, map);
        } catch (error) {
            next(error);
        }
    });
};

// Middleware для обработки ошибок
app.use((err, req, res, next) => {
    responseSendError(res, err);
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});

module.exports = {
    get,
    post
};
