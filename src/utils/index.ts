const Chain3 = require('chain3');
const Web3EthAbi = require('web3-eth-abi');
const request = require('request');

export const chain3Instance = (vnodeUri: string, scsUri: string) => {
    let chain3 = new Chain3();
    chain3.setProvider(new chain3.providers.HttpProvider(vnodeUri));
    chain3.setScsProvider(new chain3.providers.HttpProvider(scsUri));
    if (!chain3.isConnected()) {
        throw new Error('unable to connect to moac vnode at ' + vnodeUri);
    } else {
        return chain3;
    }
}

export const getBalance = (scsUri: string, subchainaddr: string, dappAddr: string, data: any) => {
    return new Promise(function (resolve, reject) {
        let options = {
            'method': 'POST',
            'url': scsUri,
            'headers': {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ "jsonrpc": "2.0", "method": "scs_directCall", "params": [{ "to": subchainaddr, "dappAddr": dappAddr, "data": data }], "id": 101 })
        };
        request(options, function (error: any, response: any) {
            if (error) reject(error);
            let result = JSON.parse(response.body).result;
            let res = Web3EthAbi.decodeParameters([{ type: 'uint256', name: 'balance' }, { type: 'uint256', name: 'freeze' }], result)
            resolve({ balance: res.balance, freeze: res.freeze })
        });
    })
}

export const getERC20Balance = (scsUri: String, subchainaddr: string, token: string, data: any) => {
    return new Promise(function (resolve, reject) {
        let options = {
            'method': 'POST',
            'url': scsUri,
            'headers': {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ "jsonrpc": "2.0", "method": "scs_directCall", "params": [{ "to": subchainaddr, "dappAddr": token, "data": data }], "id": 101 })
        };
        request(options, function (error: any, response: any) {
            if (error) reject(error);
            let result = JSON.parse(response.body).result;
            let res = Web3EthAbi.decodeParameter('uint256', result);
            resolve(res);
        });
    })
}