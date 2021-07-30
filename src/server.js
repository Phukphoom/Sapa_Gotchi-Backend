const ethers = require('ethers');

const { RPC_URL } = require('./config');

const server = async () => {
    let httpProvider = new ethers.providers.JsonRpcProvider(RPC_URL.BSC_TESTNET);
    console.log('Connected to ' + RPC_URL);

    while (true) {
        await httpProvider.getBlockNumber().then((block_number) => {
            console.log('>> Current block number : ' + block_number);
        });
    }
};

server();
