const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');
const ethers = require('ethers');
require('dotenv').config();

const { cmd, download, toBigNumber } = require('./utils');
const { rpc_url, contracts } = require('./config');

const proposeValidator = async () => {
    let httpProvider = new ethers.providers.JsonRpcProvider(rpc_url.bsc_testnet);

    let wallet = new ethers.Wallet.fromMnemonic(process.env.MNEMONIC);
    wallet = wallet.connect(httpProvider);
    console.log(`Connected to [ ${rpc_url.bsc_testnet} ] with wallet's address : ${wallet.address}`);

    let balance = await httpProvider.getBalance(wallet.address);
    console.log(` >> Wallet's Balance : ${balance} wei or ${balance.div(toBigNumber('1'))} BNB`);

    let gotchiNFT_contract = new ethers.Contract(contracts.gotchiNFT.address, require('./abis/GotchiNFT.json'), wallet);
    console.log(`\nContract for listening -> ${gotchiNFT_contract.address}\n`);

    let inprocessTxCount = 0;
    gotchiNFT_contract.on('NewGotchiPropose', async (role, imageUrl, id) => {
        console.log(` >> Event "NewGotchiPropose" emited! : ( ${role}, ${imageUrl}, ${id} )`);

        let imagePath = `${__dirname}/../propose_images/${id}.jpg`;

        await download(imageUrl, imagePath).then(() => {
            console.log(`   >> Propose id:${id} image downloaded!`);
        });

        try {
            let form = new FormData();
            form.append('files', fs.readFileSync(imagePath), `${id}.jpg`);
            let { data, status } = await axios(`${process.env.IMAGE_VALIDATE_API_ENDPOINT}/OmmNusctxunYpHqnCVnq`, {
                method: 'POST',
                headers: form.getHeaders(),
                data: form,
            });
            if (status != 200) {
                throw new Error('image validation failed');
            }

            let keys = Object.keys(data.res);
            let minValueKey = keys.reduce((key, v) => (data.res[v] < data.res[key] ? v : key));
            if (data.res[minValueKey] <= 0.3) {
                let txDelay = 5000 * inprocessTxCount;
                inprocessTxCount++;

                console.log(`   >> Propose id:${id} delay for validate tx : ${txDelay} ms`);
                setTimeout(() => {
                    gotchiNFT_contract.validate(id, role.toString() == keys.indexOf(minValueKey)).then(() => {
                        console.log(`   >> Propose id:${id} validated with ${role.toString() == keys.indexOf(minValueKey)}! `);
                        cmd(`${process.platform == 'win32' ? 'del' : 'rm'} propose_images\\${id}.jpg`);
                        inprocessTxCount--;
                    });
                }, txDelay);
            } else {
                throw new Error('image validation failed');
            }
        } catch (error) {
            console.log(`   >> Propose id:${id} validate failed!`);
            inprocessTxCount--;
        }
    });
};

proposeValidator();
