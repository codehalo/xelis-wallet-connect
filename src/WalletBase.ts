import log, { type LogLevelDesc } from "loglevel";
import { ChainConnectionType, type ConnectionBase } from "./ConnectionBase";

export abstract class WalletBase extends EventTarget implements ConnectionBase {
    protected _walletReady: boolean = false;
    chainConnectionType: ChainConnectionType = ChainConnectionType.xswd;

    abstract send_query(data: string): void;


    get connected(): boolean {
        return this.walletReady;
    }

    get walletReady(): boolean {
        return this._walletReady;
    }

    set walletReady(ready: boolean) {
        this._walletReady = ready;
    }

    setLogLevel(level: LogLevelDesc): void {
        log.setLevel(level);
    }

    getLogLevel(): LogLevelDesc {
        return log.getLevel();
    }

    constructor() {
        super();
    }
}
