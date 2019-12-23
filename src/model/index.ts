export interface InitConfig {
    vnodeUri: string,
    scsUri: string,
    vnodeVia: string,
    baseAddr: string,
    dappAddr: string,
    subchainAddr: string
}

export interface Account {
    address: string;
    secret: string;
}

export interface VRS {
    v_decimal: number,
    r: string,
    s: string
}
