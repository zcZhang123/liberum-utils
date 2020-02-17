export interface InitConfig {
    vnodeUri: string,
    scsUri: string,
    vnodeVia: string,
    baseAddr: string,
    dappAddr: string,
    pairsAddr: string,
    subchainAddr: string
}

export interface Account {
    address: string;
    secret: string;
}
