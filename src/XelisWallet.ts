import log, { type LogLevelDesc } from 'loglevel';
import { ConnectWalletUI } from './ConnectWalletUI';
import { generateSecureHexString } from './utils';
import { WalletDefaults, type AppData, type MethodCallback, type QrCodeOptions, type WalletConfig } from './Wallet';
import { WalletBase } from './WalletBase';
import { WalletLocal } from './WalletLocal';
import { WalletRemote } from './WalletRemote';

export default class XelisWallet extends WalletBase {
    wallet: WalletLocal | WalletRemote | null = null;
    methodCallbacks: Map<number, MethodCallback> = new Map();
    walletUI: ConnectWalletUI;
    walletConfig: WalletConfig;

    get uiOptions() {
        return this.walletUI.uiOptions;
    }

    constructor(walletContainer: HTMLElement,
        { appData, qrCodeOptions, relayerUrl, uiOptions }: { appData?: any, qrCodeOptions?: any, relayerUrl?: string, uiOptions?: any }) {

        super();

        this.walletUI = new ConnectWalletUI(this, walletContainer, uiOptions);

        let themeClass = "";
        if (uiOptions?.theme === undefined) {
            themeClass = 'basic-theme';
        } else {
            themeClass = (uiOptions.theme === 'none' || uiOptions.theme === '') ? '' : uiOptions.theme;
        }

        if (themeClass !== '') {
            walletContainer.classList.add(themeClass);
        }

        let userAppData: AppData = {
            id: appData.id ?? generateSecureHexString(64),
            name: appData.name ?? "",
            description: appData.description ?? "",
            url: appData.url ?? window.location.href,
            permissions: appData.permissions ?? []
        }

        let userQrCodeOptions: QrCodeOptions = {
            color: qrCodeOptions.color ?? "#000000",
            backgroundColor: qrCodeOptions.backgroundColor ?? "#ffffff",
            centerBackgroundColor: qrCodeOptions.centerBackgroundColor ?? "#FFFFFF",
            logoUrl: qrCodeOptions.logoUrl ?? "",
            logoSize: qrCodeOptions.logoSize ?? 0.2
        }

        this.walletConfig = {
            appData: userAppData,
            qrCodeOptions: userQrCodeOptions,
            relayerUrl: relayerUrl ?? WalletDefaults.RELAYER_XELIS,
        }

        console.log(`[XelisWallet] walletconfig`, this.walletConfig);
    }

    registerWalletCallbacks: () => void = () => { };

    canConnect: () => boolean = () => {
        let connect = true;
        if (this.walletConfig.appData.id === "" || this.walletConfig.appData.id === undefined) {
            alert(`This application has no id. Please provide a 64 character hexadecimal string for the application id before attempting to connect to a wallet.`);
            connect = false;
        } else if (this.walletConfig.appData.id.length !== 64) {
            alert(`This application id is not a 64 character hexadecimal string. Please provide a 64 character hexadecimal string for the application id before attempting to connect to a wallet.`);
            connect = false;
        }

        if (this.walletConfig.appData.url === "" || this.walletConfig.appData.url === undefined) {
            alert(`This application has no url. Please provide a url before attempting to connect to a wallet.`);
            connect = false;
        }

        if (this.walletConfig.appData.name === "" || this.walletConfig.appData.name === undefined) {
            alert(`This application has no name. Please provide a name before attempting to connect to a wallet.`);
            connect = false;
        }
        if (this.walletConfig.appData.description === "" || this.walletConfig.appData.description === undefined) {
            alert(`This application has no description. Please provide a description before attempting to connect to a wallet.`);
            connect = false;
        }

        if (this.walletConfig.appData.permissions.length === 0) {
            alert(`This application is attempting to connect to the wallet without any permissions.`);
        }

        return connect;
    }

    connectLocalWallet(_: HTMLElement) {
        const _thisXW = this;

        if (!this.canConnect()) {
            return;
        }

        if (_thisXW.wallet !== null) {
            log.trace("Disconnecting from wallet");
            if (_thisXW.wallet instanceof WalletLocal) {
                _thisXW.wallet.close();
                _thisXW.wallet = null;
            } else if (_thisXW.wallet instanceof WalletRemote) {
                _thisXW.wallet.close();
                _thisXW.wallet = null;
            }
        }

        log.trace("[XelisWallet] Connecting to local wallet");
        _thisXW.wallet = new WalletLocal(this, this.walletConfig);

        if (_thisXW.wallet.wallet_ws === null) {
            console.warn("[XelisWallet] Wallet websocket is null.");
            return;
        }

        log.trace("[XelisWallet] Local Wallet websocket opened.");

    }

    connectRemoteWallet(walletConnectContainer: HTMLElement) {
        const _thisXW = this;

        if (!this.canConnect()) {
            return;
        }

        log.trace("Connecting to remote wallet");
        if (_thisXW.wallet !== null) {
            log.trace("Disconnecting from wallet");
            if (_thisXW.wallet instanceof WalletLocal) {
                _thisXW.wallet.close();
                _thisXW.wallet = null;
            }
            else if (_thisXW.wallet instanceof WalletRemote) {
                _thisXW.wallet.close();
                _thisXW.wallet = null;
            }
        }

        const walletRemoteOptions = {
            onConnected: () => {
                log.trace("Wallet connected");
            },

            onClose: () => {
                // WalletRemote and poll will trigger wallet-disconnect listener which will handle cleanup.
                log.trace("[XelisWallet] Remote Wallet disconnected");
            },
        };

        this.wallet = new WalletRemote(walletConnectContainer, this, this.walletConfig, walletRemoteOptions);

    }

    setLogLevel(level: LogLevelDesc): void {
        super.setLogLevel(level);
        if (this.wallet) {
            this.wallet.setLogLevel(level);
        }
    }

    send_query(data: string): void {
        if (this.wallet && this.walletReady) {
            this.wallet.send_query(data);
        }
    }

}
