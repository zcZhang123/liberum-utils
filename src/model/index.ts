export interface Account {
    address: string;
    secret: string;
}

export interface VRS {
    v_decimal: number,
    r: string,
    s: string
}
