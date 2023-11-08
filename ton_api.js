const { handler, METHODS } = require('./helpers.js');
const { TonClient, WalletContractV4, fromNano, internal } = require('ton');
const { mnemonicNew } = require('ton-crypto');
const { mnemonicToWalletKey } = require('@ton/crypto');
const { getHttpEndpoint } = require('@orbs-network/ton-access');
const { client } = require('./api_client.js');


const blockchainTON = {
    function: {
        sleep: async (ms) =>
            new Promise(resolve => setTimeout(resolve, ms)),
    },
    config: {
        client: handler(async (req) => {
            const endpoint = await getHttpEndpoint();
            return new TonClient({ endpoint });
        }, `Error Mnemonic`),
    },
    tonscan: {
        getHash: handler(async (req) => {
            const address = req.address;
            const link = `https://api.ton.cat/v2/contracts/address/${address}/transactions?limit=1`;
            const object = await client.get(link);
            return object[0].hash;
        }, `Error Get Hash`),

    },
    blockchain: {
        mnemonic: handler(async (req) => {
            return req.mnemonic ?? (await mnemonicNew(24)).join(' ');
        }, `Error Mnemonic`),
        keyPair: handler(async (req) => {
            const mnemonic = await blockchainTON.blockchain.mnemonic(req);
            return {
                keyPair: await mnemonicToWalletKey(mnemonic.split(" ")),
                mnemonic: mnemonic,
            };
        }, `Error keyPair`),
        wallet: handler(async (req) => {
            const { keyPair, mnemonic } = await blockchainTON.blockchain.keyPair(req);
            const workchain = 0;
            return {
                mnemonic: mnemonic,
                wallet: WalletContractV4.create({ workchain, publicKey: keyPair.publicKey })
            };
        }, `Error Wallet`),
    },
    utility: {
        wallet: handler(async (req) => {
            const { mnemonic, wallet } = await blockchainTON.blockchain.wallet(req);
            const client = await blockchainTON.config.client(req);
            const balance = await client.getBalance(wallet.address);
            return {
                address: wallet.address.toString({ urlSafe: true, bounceable: false }),
                balance: fromNano(balance),
                mnemonic: mnemonic,
            };
        }, `Utility Error Wallet`),
        sendTON: handler(async (req) => {
            const client = await blockchainTON.config.client(req);
            const { wallet } = await blockchainTON.blockchain.wallet(req);
            if (!await client.isContractDeployed(wallet.address)) {
                console.log("wallet is not deployed");
                // await client.open(wallet.address);
                // await blockchainTON.function.sleep(3000);
                // return 'wallet is not deployed';
            }
            const { keyPair } = await blockchainTON.blockchain.keyPair(req);
            const walletContract = client.open(wallet);
            const seqno = await walletContract.getSeqno();
            await walletContract.sendTransfer({
                secretKey: keyPair.secretKey,
                seqno: seqno,
                messages: [
                    internal({
                        to: req.to,
                        value: req.value,
                        body: req.body,
                        bounce: false,
                    })
                ]
            });
            let currentSeqno = seqno;
            while (currentSeqno == seqno) {
                console.log("waiting for transaction to confirm...");
                await blockchainTON.function.sleep(1500);
                currentSeqno = await walletContract.getSeqno();
            }
            const address = wallet.address.toString({ urlSafe: true, bounceable: false });
            console.log(`transaction currentSeqno: ${currentSeqno}`);
            return { hash: await blockchainTON.tonscan.getHash({ address: address }) };
        }, `Utility Error Send TON`),
    },
    api: {
        wallet: {
            methods: [METHODS.get, METHODS.post],
            handler: handler(async (req) => {
                return await blockchainTON.utility.wallet(req);
            }, 'API Error Wallet')
        },
        sendTON: {
            methods: [METHODS.get, METHODS.post],
            handler: handler(async (req) => {
                return await blockchainTON.utility.sendTON(req);
            }, 'API Error sendTON')
        }
    },
};

module.exports = {
    blockchainTON: blockchainTON
};
