const EthCrypto = require('eth-crypto');
const { soliditySha3 } = require("web3-utils");
const Hex = require('crypto-js/enc-hex');
const sha3 = require('crypto-js/sha3');
const BigNumber = require('bignumber.js');

import { asmABI, dappABI, erc20ABI } from './utils/ABIs';
import { chain3Instance } from './utils/index'
import { InitConfig, Account, VRS } from "./model";


class Liberum {
    private static vnodeVia: string;
    private static dappAddr: string;
    private static subchainaddr: string;
    private static chain3: any;
    private static tokenContract: any;
    private static mcObject: any;

    public static init(InitConfig: InitConfig) {
        try {
            Liberum.vnodeVia = InitConfig.vnodeVia;
            Liberum.dappAddr = InitConfig.dappAddr;
            Liberum.subchainaddr = InitConfig.subchainAddr;
            Liberum.chain3 = chain3Instance(InitConfig.vnodeUri, InitConfig.scsUri);
            Liberum.mcObject = Liberum.chain3.microchain(asmABI);
            Liberum.mcObject.setVnodeAddress(InitConfig.vnodeVia);
            Liberum.tokenContract = Liberum.mcObject.getDapp(InitConfig.subchainAddr, dappABI, InitConfig.dappAddr);
        } catch (error) {
            throw error
        }
    }

    /**
     * 获取合约信息
     */
    public static getDappInfo() {
        try {
            let admin = Liberum.tokenContract.admin();
            let feeAccount = Liberum.tokenContract.feeAccount();
            let accountLevelsAddr = Liberum.tokenContract.accountLevelsAddr();
            let feeMake = Liberum.chain3.fromSha(Liberum.tokenContract.feeMake());
            let feeTake = Liberum.chain3.fromSha(Liberum.tokenContract.feeTake());
            let feeRebate = Liberum.chain3.fromSha(Liberum.tokenContract.feeRebate())
            return {
                admin: admin,
                feeAccount: feeAccount,
                accountLevelsAddr: accountLevelsAddr,
                feeMake: feeMake,
                feeTake: feeTake,
                feeRebate: feeRebate
            }
        } catch (error) {
            throw error
        }
    }

    /**
     * 修改账户等级控制合约地址
     * @param  {Account} baseAccount 合约部署者账户
     * @param {address} accountLevelsAddr 修改账户地址
     */
    public static async changeAccountLevelsAddr(baseAccount: Account, accountLevelsAddr: string) {
        try {
            var data = Liberum.dappAddr + Liberum.chain3.sha3('changeAccountLevelsAddr(address)').substr(2, 8)
                + Liberum.chain3.encodeParams(['address'], [accountLevelsAddr]);
            let res = await Liberum.sendRawTransaction(baseAccount.address, baseAccount.secret, 0, data);
            return res;
        } catch (error) {
            throw error
        }
    }

    /**
     * 修改手续费缴纳账户
     * @param  {Account} baseAccount 合约部署者账户
     * @param {address}  feeAccount 缴费账户
     */
    public static async changeFeeAccount(baseAccount: Account, feeAccount: string) {
        try {
            if (Liberum.chain3.isAddress(feeAccount)) {
                var data = Liberum.dappAddr + Liberum.chain3.sha3('changeFeeAccount(address)').substr(2, 8)
                    + Liberum.chain3.encodeParams(['address'], [feeAccount]);
                let res = await Liberum.sendRawTransaction(baseAccount.address, baseAccount.secret, 0, data)
                return res;
            } else {
                throw new Error('invalid address');
            }
        } catch (error) {
            throw error
        }
    }

    /**
     * 修改成交方手续费,需不高于当前值
     * @param  {Account} baseAccount 合约部署者账户
     * @param {number} feeMake 手续费
     */
    public static async changeFeeMake(baseAccount: Account, feeMake: number) {
        try {
            var beforeFeeMake = Liberum.chain3.fromSha(this.tokenContract.feeMake());
            if (feeMake < beforeFeeMake) {
                var data = Liberum.dappAddr + Liberum.chain3.sha3('changeFeeMake(uint256)').substr(2, 8)
                    + Liberum.chain3.encodeParams(['address'], [Liberum.chain3.toSha(feeMake, 'mc')]);
                let res = await Liberum.sendRawTransaction(baseAccount.address, baseAccount.secret, 0, data)
                return res;
            } else {
                throw new Error('invalid feeMake');
            }
        } catch (error) {
            throw error
        }
    }

    /**
     *  修改被成交方手续费，需不高于当前值且不小于当前回扣值(feeRebate)
     * @param  {Account} baseAccount 合约部署者账户
     * @param {number} feeTake 修改后被成交方的手续费
     */
    public static async changeFeeTake(baseAccount: Account, feeTake: number) {
        try {
            var beforeFeeTake = Liberum.chain3.fromSha(Liberum.tokenContract.feeTake());
            var beforeFeeRebate = Liberum.chain3.fromSha(Liberum.tokenContract.feeRebate());
            if (feeTake < beforeFeeTake && feeTake > beforeFeeRebate) {
                var data = Liberum.dappAddr + Liberum.chain3.sha3('changeFeeTake(uint256)').substr(2, 8)
                    + Liberum.chain3.encodeParams(['address'], [Liberum.chain3.toSha(feeTake, 'mc')]);
                let res = await Liberum.sendRawTransaction(baseAccount.address, baseAccount.secret, 0, data)
                return res;
            } else {
                throw new Error('invalid feeRebate');
            }
        } catch (error) {
            throw error
        }
    }

    /**
     * 修改回扣值，需不小于当前值且不高于被成交方手续费(feeTake)
     * @param  {Account} baseAccount 合约部署者账户
     * @param {number} feeRebate 回扣值
     */
    public static async changeFeeRebate(baseAccount: Account, feeRebate: number) {
        try {
            var beforeFeeTake = Liberum.chain3.fromSha(Liberum.tokenContract.feeTake());
            var beforeFeeRebate = Liberum.chain3.fromSha(Liberum.tokenContract.feeRebate());
            if (feeRebate > beforeFeeRebate && feeRebate < beforeFeeTake) {
                var data = Liberum.dappAddr + Liberum.chain3.sha3('changeFeeRebate(uint256)').substr(2, 8)
                    + Liberum.chain3.encodeParams(['address'], [Liberum.chain3.toSha(feeRebate, 'mc')]);
                let res = await Liberum.sendRawTransaction(baseAccount.address, baseAccount.secret, 0, data)
                return res;
            } else {
                throw new Error('invalid feeTake');
            }
        } catch (error) {
            throw error
        }
    }

    /**
     * 子链原生币合约充值
     * @param {Account} account 充值账户
     * @param {number} value 充值数量
     */
    public static async deposit(account: Account, value: number) {
        try {
            var data = Liberum.dappAddr + Liberum.chain3.sha3('deposit()').substr(2, 8);
            let res = await Liberum.sendRawTransaction(account.address, account.secret, value, data)
            return res;
        } catch (error) {
            throw error
        }
    }

    /**
     * 子链原生币合约提币
     * @param {Account} account 提币账户
     * @param {number} value 提币数量
     */
    public static async withdraw(account: Account, value: number) {
        try {
            var data = Liberum.dappAddr + Liberum.chain3.sha3('withdraw(uint256)').substr(2, 8)
                + Liberum.chain3.encodeParams(['uint256'], [Liberum.chain3.toSha(value, 'mc')]);
            let res = await Liberum.sendRawTransaction(account.address, account.secret, 0, data)
            return res;
        } catch (error) {
            throw error
        }
    }

    /**
     * 子链token合约充值
     * @param {Account} account 充值账户
     * @param {address} token 充值token地址
     * @param {number} value 充值数量
     */
    public static async depositToken(account: Account, token: string, value: number) {
        try {
            await Liberum.approve(account, Liberum.dappAddr, token, value)
            var data = Liberum.dappAddr + Liberum.chain3.sha3('depositToken(address,uint256)').substr(2, 8)
                + Liberum.chain3.encodeParams(['address', 'uint256'], [token, Liberum.chain3.toSha(value, 'mc')]);
            let res = await Liberum.sendRawTransaction(account.address, account.secret, 0, data)
            return res;
        } catch (error) {
            throw error
        }
    }

    /**
     * 子链token合约提现
     * @param {Account} account 提现账户
     * @param {address} token 提现token地址
     * @param {number}  value 提现数量
     */
    public static async withdrawToken(account: Account, token: string, value: number) {
        try {
            var data = Liberum.dappAddr + Liberum.chain3.sha3('withdrawToken(address,uint256)').substr(2, 8)
                + Liberum.chain3.encodeParams(['address', 'uint256'], [token, Liberum.chain3.toSha(value, 'mc')]);
            let res = await Liberum.sendRawTransaction(account.address, account.secret, 0, data)
            return res;
        } catch (error) {
            throw error
        }
    }

    /**
     * 合约充提余额查询
     * @param {address} token token地址
     * @param {address} address 查询地址
     */
    public static balanceOf(token: string, address: string) {
        return new Promise(function (resolve, reject) {
            try {
                let tokenContract = Liberum.mcObject.getDapp(Liberum.subchainaddr, JSON.parse(erc20ABI), token);
                let tokenBalance = tokenContract.balanceOf(address);
                let decimals = tokenContract.decimals();
                let balance = Liberum.tokenContract.balanceOf(token, address)
                let data = {
                    balance: new BigNumber(Liberum.chain3.fromSha(balance)).toString(),
                    // balance: new BigNumber(Liberum.chain3.fromSha(balance[0])).toString(),
                    // freeze: new BigNumber(Liberum.chain3.fromSha(balance[1])).toString(),
                    erc20Balance: new BigNumber(tokenBalance).dividedBy(Math.pow(10, decimals)).toString()
                }

                resolve(data);
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * 创建挂单
     * @param {Account} account 挂单账户
     * @param {address} tokenGet 交易token地址
     * @param {number} amountGet 交易token数量
     * @param {address} tokenGive 付出token地址
     * @param {number} amountGive 付出token数量
     * @param {number} expires 有效区块
     */
    public static async createOrder(account: Account, tokenGet: string, amountGet: number, tokenGive: string, amountGive: number, expires: number) {
        try {
            let nonce = Liberum.chain3.scs.getNonce(Liberum.subchainaddr, account.address);
            let blockNum = Liberum.chain3.scs.getBlockNumber(Liberum.subchainaddr) + expires;
            var _data = Liberum.chain3.encodeParams(['address', 'address', 'uint256', 'address', 'uint256', 'uint256', 'uint256'],
                [Liberum.dappAddr, tokenGet, Liberum.chain3.toSha(amountGet, 'mc'), tokenGive, Liberum.chain3.toSha(amountGive, 'mc'), blockNum, nonce]);
            let VRS = Liberum.getVRS(account.secret, _data)
            var data = Liberum.dappAddr + Liberum.chain3.sha3('order(address,uint256,address,uint256,uint256,uint256)').substr(2, 8)
                + Liberum.chain3.encodeParams(['address', 'uint256', 'address', 'uint256', 'uint256', 'uint256'],
                    [tokenGet, Liberum.chain3.toSha(amountGet, 'mc'), tokenGive, Liberum.chain3.toSha(amountGive, 'mc'), blockNum, nonce]);
            let res = await Liberum.sendRawTransaction(account.address, account.secret, 0, data)
            return { res, nonce, blockNum, VRS };
        } catch (error) {
            throw error
        }
    }

    /**
     * 挂单买卖
     * @param {Account} account 买家账户
     * @param {address} tokenGet 买家付出的token地址
     * @param {number} amountGet 买家付出的token数量
     * @param {address} tokenGive 买家获得的token地址
     * @param {number} amountGive 买家获得的token数量
     * @param {address} user 卖家地址
     * @param {number} amount 买家购买数量
     * @param {number} nonce 挂单时nonce
     * @param {number} blockNum 挂单时blockNum
     * @param {VRS} VRS VRS
     */
    public static async tradeOrder(account: Account, tokenGet: string, amountGet: number, tokenGive: string, amountGive: number, user: string, amount: number, nonce: number, blockNum: number, VRS: VRS) {
        try {
            var data = Liberum.dappAddr + Liberum.chain3.sha3('trade(address,uint256,address,uint256,uint256,uint256,address,uint8,bytes32,bytes32,uint256)').substr(2, 8)
                + Liberum.chain3.encodeParams(['address', 'uint256', 'address', 'uint256', 'uint256', 'uint256', 'address', 'uint8', 'bytes32', 'bytes32', 'uint256'],
                    [tokenGet, Liberum.chain3.toSha(amountGet, 'mc'), tokenGive, Liberum.chain3.toSha(amountGive, 'mc'), blockNum, nonce, user,
                        VRS.v_decimal, VRS.r, VRS.s, Liberum.chain3.toSha(amount, 'mc')]);

            let res = await Liberum.sendRawTransaction(account.address, account.secret, 0, data)
            return res;
        } catch (error) {
            throw error
        }
    }

    /**
     * 获取挂单余额
     * @param {address} tokenGet 挂单获取token地址
     * @param  {number} amountGet 挂单获取token数量
     * @param  {address} tokenGive 挂单付出token地址
     * @param  {number} amountGive 挂单付出token数量
     * @param  {address} user 挂单用户地址
     * @param  {number} nonce 挂单时nonce
     * @param  {number} blockNum 挂单时blockNum
     * @param {number} VRS VRS
     */
    public static getAvailableVolume(tokenGet: string, amountGet: number, tokenGive: string, amountGive: number, user: string, nonce: number, blockNum: number, VRS: VRS) {
        try {
            var res = Liberum.tokenContract.availableVolume(tokenGet, Liberum.chain3.toSha(amountGet, 'mc'), tokenGive, Liberum.chain3.toSha(amountGive, 'mc'), blockNum, nonce, user,
                VRS.v_decimal, VRS.r, VRS.s);
            return Liberum.chain3.fromSha(res);
        } catch (error) {
            throw error
        }
    }

    /**
     * 获取挂单成交额
     * @param  {address} tokenGet 挂单获取token地址
     * @param  {number} amountGet 挂单获取token数量
     * @param  {address} tokenGive 挂单付出token地址
     * @param  {number} amountGive 挂单付出token数量
     * @param  {address} user 挂单用户地址
     * @param  {number} nonce 挂单时nonce
     * @param  {number} blockNum 挂单时blockNum
     */
    public static getAmountFilled(tokenGet: string, amountGet: number, tokenGive: string, amountGive: number, user: string, nonce: number, blockNum: number) {
        try {
            var res = Liberum.tokenContract.amountFilled(tokenGet, Liberum.chain3.toSha(amountGet, 'mc'), tokenGive, Liberum.chain3.toSha(amountGive, 'mc'), blockNum, nonce, user);
            return Liberum.chain3.fromSha(res);
        } catch (error) {
            throw error
        }
    }

    /**
     * 取消挂单
     * @param {Account} account 取消账户
     * @param {address} tokenGet 挂单交易token地址
     * @param {number} amountGet 挂单交易token数量
     * @param {address} tokenGive 挂单付出token地址
     * @param {number} amountGive 挂单付出token数量
     * @param {number} nonce 挂单时nonce
     * @param {number} blockNum 挂单时blockNum
     * @param {VRS} VRS  挂单时VRS
     */
    public static async cancelOrder(account: Account, tokenGet: string, amountGet: number, tokenGive: string, amountGive: number, nonce: number, blockNum: number, VRS: VRS) {
        try {
            var data = Liberum.dappAddr + Liberum.chain3.sha3('cancelOrder(address,uint256,address,uint256,uint256,uint256,uint8,bytes32,bytes32)').substr(2, 8)
                + Liberum.chain3.encodeParams(['address', 'uint256', 'address', 'uint256', 'uint256', 'uint256', 'address', 'uint8', 'bytes32', 'bytes32', 'uint256'],
                    [tokenGet, Liberum.chain3.toSha(amountGet, 'mc'), tokenGive, Liberum.chain3.toSha(amountGive, 'mc'), blockNum, nonce,
                        VRS.v_decimal, VRS.r, VRS.s]);

            let res = await Liberum.sendRawTransaction(account.address, account.secret, 0, data)
            return res;
        } catch (error) {
            throw error
        }
    }

    /**
     * 获取VRS
     * @param {string} secret 挂单地址密钥
     * @param {string} data 交易数据
     */
    public static getVRS(secret: string, data: string) {
        try {
            const prefix = "\x19MoacNode Signed Message:\n32";
            let value = Hex.parse(data);
            let noPrefixHash = sha3(value, {
                outputLength: 256
            }).toString();
            const hash = soliditySha3(
                { type: 'string', value: prefix },
                { type: 'bytes32', value: noPrefixHash }
            );
            const signtx = EthCrypto.sign(
                secret,
                hash
            ).slice(2);
            var r = `0x${signtx.slice(0, 64)}`
            var s = `0x${signtx.slice(64, 128)}`
            var v = `0x${signtx.slice(128, 130)}`
            var v_decimal = Liberum.chain3.toDecimal(v);
            if (v_decimal != 27 && v_decimal != 28) {
                v_decimal += 27
            }
            return { v_decimal, r, s }
        } catch (error) {
            throw error
        }
    }

    /**
     * 发起交易
     * @param {address} from 发起交易地址
     * @param {string} secret 发起交易地址密钥
     * @param {string} data 交易数据
     */
    public static sendRawTransaction(from: string, secret: string, value: number, data: string) {
        return new Promise(function (resolve, reject) {
            let nonce = Liberum.chain3.scs.getNonce(Liberum.subchainaddr, from);
            var rawTx = {
                from: from,
                to: Liberum.subchainaddr,
                nonce: Liberum.chain3.toHex(nonce),
                gasLimit: Liberum.chain3.toHex("0"),
                gasPrice: Liberum.chain3.toHex("0"),
                value: Liberum.chain3.toHex(Liberum.chain3.toSha(value, 'mc')),
                chainId: Liberum.chain3.toHex(Liberum.chain3.version.network),
                via: Liberum.vnodeVia,
                shardingFlag: "0x1",
                data: data
            };
            var signTx = Liberum.chain3.signTransaction(rawTx, secret);
            Liberum.chain3.mc.sendRawTransaction(signTx, function (err, hash: string) {
                if (!err) {
                    while (true) {
                        var receipt = Liberum.chain3.scs.getReceiptByHash(Liberum.subchainaddr, hash);
                        if (receipt && !receipt.failed) {
                            resolve({ "result": "success", "hash": hash });
                            break;
                        } else if (receipt && receipt.failed) {
                            resolve({ "result": "error", "hash": hash });
                            break;
                        }
                    }
                } else {
                    reject(err.message);
                }
            })
        })
    }

    /**
     * 子链token授权
     * @param account 授权账户
     * @param to 被授权地址
     * @param tokenAdd token地址
     * @param amount 数量
     */
    public static approve(account: Account, to: string, tokenAdd: string, amount: number) {
        return new Promise(function (resolve, reject) {
            let nonce = Liberum.chain3.scs.getNonce(Liberum.subchainaddr, account.address);
            var rawTx = {
                from: account.address,
                to: Liberum.subchainaddr,
                nonce: Liberum.chain3.toHex(nonce),
                gasLimit: Liberum.chain3.toHex("0"),
                gasPrice: Liberum.chain3.toHex("0"),
                chainId: Liberum.chain3.toHex(Liberum.chain3.version.network),
                via: Liberum.vnodeVia,
                shardingFlag: "0x1",
                data: tokenAdd + Liberum.chain3.sha3('approve(address,uint256)').substr(2, 8) +
                    Liberum.chain3.encodeParams(['address', 'uint256'], [to, Liberum.chain3.toSha(amount, 'mc')])
            };
            var signTx = Liberum.chain3.signTransaction(rawTx, account.secret);
            Liberum.chain3.mc.sendRawTransaction(signTx, function (err, hash: string) {
                if (!err) {
                    while (true) {
                        var receipt = Liberum.chain3.scs.getReceiptByHash(Liberum.subchainaddr, hash);
                        if (receipt && !receipt.failed) {
                            resolve({ "result": "success", "hash": hash });
                            break;
                        } else if (receipt && receipt.failed) {
                            resolve({ "result": "error", "hash": hash });
                            break;
                        }
                    }
                } else {
                    reject(err.message);
                }
            })
        })
    }
}

export default Liberum;
export { Liberum };