import log from 'loglevel';
import { generateSecureHexString } from './utils';
import { WalletDefaults, WalletMethodID, type WalletConfig } from './Wallet';
import { WalletBase } from './WalletBase';
import type XelisWallet from './XelisWallet';

export class WalletLocal extends WalletBase {
    public wallet_ws: WebSocket | null = null;
    public address: WalletInfo = WalletInfo;
    can_query_wallet: boolean = false;
    directUrl: string;

    xelisWallet: XelisWallet; // reference to the main wallet object

    constructor(xelisWallet: XelisWallet, walletConfig: WalletConfig, directUrl = WalletDefaults.LOCAL_XSWD_WS) {
        super();
        this.xelisWallet = xelisWallet;
        this.directUrl = directUrl;
        if (this.directUrl === '') {
            console.warn(`The xswd url of the wallet is blank.`);
        }

        this.connect(walletConfig);
    }

    connect(walletConfig: WalletConfig) {

        const _thisWallet = this;

        this.wallet_ws = new WebSocket(this.directUrl);

        this.wallet_ws.onopen = () => {
            // always need to start with fresh app id in case wallet rejected previous
            // connection attempt or user cancelled previous request.
            walletConfig.appData.id = generateSecureHexString(64);

            const appData = {
                "id": walletConfig.appData.id,
                "name": walletConfig.appData.name,
                "description": walletConfig.appData.description,
                "url": walletConfig.appData.url,
                "permissions": walletConfig.appData.permissions,
                "signature": null
            }

            this.send_query(JSON.stringify(appData));

            //check connection every five seconds
            const interval = setInterval(() => {
                if (this.wallet_ws?.readyState !== WebSocket.OPEN) {
                    log.trace('[WalletLocal] Lost connection to wallet...');
                    const wallet_disconnect = new CustomEvent("wallet-disconnect", {
                        detail: { ws: _thisWallet.wallet_ws },
                    });
                    this.xelisWallet.dispatchEvent(wallet_disconnect);

                    clearInterval(interval);
                }
            }, 5000);
        };

        this.wallet_ws.onmessage = (event) => {

            const data = JSON.parse(event.data);
            // stop topo_height spamming the console.
            if (data && data.id && data.id !== WalletMethodID.NEW_TOPO_HEIGHT) {
                log.trace('[WalletLocal] onmessage', event.data);
            }

            if (data.error !== undefined) {
                log.trace(`<error>${data.error.message}</error>`);
            }

            if (data.id === walletConfig.appData.id) {
                if (data.result.success) {

                    // const xswd = {
                    //     "id": 9999,
                    //     "jsonrpc": "2.0",
                    //     "method": "xswd.permissionslist",
                    //     "params": { "asset": asset_hash }
                    // };

                    // this.send_query(JSON.stringify(xswd));

                    this.walletReady = this.xelisWallet.walletReady = true;

                    const wallet_ready_event = new CustomEvent("wallet-ready", {
                        detail: { data },
                    });
                    this.xelisWallet.dispatchEvent(wallet_ready_event);
                } else {
                    this.walletReady = this.xelisWallet.walletReady = false;
                    const wallet_connect_error = new CustomEvent("wallet-connect-error", {
                        detail: { data },
                    });
                    this.xelisWallet.dispatchEvent(wallet_connect_error);
                    log.trace(`<error><b>Error</b>: ${data}</error>`);
                }
                return;
            }

            const connection_data_received_event = new CustomEvent("connection-data-received", {
                detail: { data },
            });

            this.xelisWallet.dispatchEvent(connection_data_received_event);
        };

        this.wallet_ws.onerror = (error) => {
            this.walletReady = this.xelisWallet.walletReady = false;
            const wallet_connect_error = new CustomEvent("wallet-connect-error", {
                detail: { error },
            });
            this.xelisWallet.dispatchEvent(wallet_connect_error);
            console.error('[WalletLocal] WebSocket Error:', error);
        };

        this.wallet_ws.onclose = () => {
            this.walletReady = this.xelisWallet.walletReady = false;
            log.trace('[WalletLocal] Disconnected');
            const wallet_disconnect = new CustomEvent("wallet-disconnect", {
                detail: { ws: _thisWallet.wallet_ws },
            });
            this.xelisWallet.dispatchEvent(wallet_disconnect);
        };
    }

    close() {
        if (this.wallet_ws !== null) {
            this.wallet_ws.close();
        }
    }

    send_query(query: string) {
        if (this.wallet_ws === null) {
            log.trace(`<error><b>Error</b>: Client not connected to a source. Please connect first.</error>`);
            return;
        }

        if (this.wallet_ws.readyState !== WebSocket.OPEN) {
            log.trace(`<error><b>Error</b>: Client not connected to a source. Please connect first.</error>`);
            return;
        }

        try {
            let parsed_query = JSON.parse(query);
            parsed_query = JSON.stringify(parsed_query);
            this.wallet_ws.send(parsed_query);
        } catch (error) {
            log.trace(`<error>${error}</error>`);
            log.trace(`<warn>NOTE: Relaxed JSON is unsupported. Use strict JSON only.</warn>`);
        }
    }
}

export type Address = string;
export type AddressLabel = string;
export type Balance = number;

export class WalletInfo {
    static address: [Address, AddressLabel] = ['', 'ADDRESS_LABEL'];
    static balance: Balance = 0;

    static getAddress() {
        return WalletInfo.address[0];
    }

    static getBalance() {
        return WalletInfo.balance;
    }

    static getAddressLabel() {
        return WalletInfo.address[1];
    }
}



