const server = require('./network_server.js');
const { blockchainTON } = require('./ton_api.js');

const tonAPIV1 = '/ton/api/v1/';

function tonRouteV1(route) {
    return tonAPIV1 + route;
}

// TON API
for (const [route, config] of Object.entries(blockchainTON.api)) {
    for (const method of config.methods) {
        server[method](tonRouteV1(route), config.handler);
    }
}
