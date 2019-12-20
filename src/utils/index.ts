const Chain3 = require('chain3');

export const chain3Instance = (vnodeUri: string, scsUri: string) => {
    var chain3 = new Chain3();
    chain3.setProvider(new chain3.providers.HttpProvider(vnodeUri));
    chain3.setScsProvider(new chain3.providers.HttpProvider(scsUri));
    if (!chain3.isConnected()) {
        throw new Error('unable to connect to moac vnode at ' + vnodeUri);
    } else {
        return chain3;
    }
}
