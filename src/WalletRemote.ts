import { createConnection, generateQRCodeDataURL, RelayClient } from "@xelis/xswd-connect";
import type { RelayedConnection } from "@xelis/xswd-connect";
import type { WalletConfig } from './Wallet';

import type XelisWallet from "./XelisWallet";
import { WalletBase } from "./WalletBase";
import log from "loglevel";

const Noop = () => { };

interface WalletRemoteOptions {
    onConnected: () => void;
    onClose: () => void;
}

export class WalletRemote extends WalletBase {

    client: RelayClient | null = null;
    connection: RelayedConnection | null = null;
    walletConnectContainer: HTMLElement;
    qrCodeContainer: HTMLElement;
    walletErrorContainer: HTMLElement;
    walletConfig: WalletConfig;
    xelisWallet: XelisWallet;
    methodCallbacks: Map<number, (data: any) => void> = new Map();

    constructor(walletConnectContainer: HTMLElement, xelisWallet: XelisWallet, walletConfig: WalletConfig, walletRemoteOptions: WalletRemoteOptions = { onConnected: Noop, onClose: Noop }) {
        super();
        this.xelisWallet = xelisWallet;
        this.walletConnectContainer = walletConnectContainer;
        this.qrCodeContainer = walletConnectContainer.querySelector('.qr-code-container') as HTMLElement;
        this.walletErrorContainer = document.createElement('div');
        this.walletErrorContainer.classList.add('wallet-error-container');
        this.walletErrorContainer.innerHTML = 'Use your phone to scan the QR code above.';
        this.walletConfig = walletConfig;

        this.initConnection(walletRemoteOptions);
    }

    private async initConnection(walletRemoteOptions: WalletRemoteOptions) {
        await createConnection({
            // 1. First, set up data to send to relayer
            appData: {
                id: this.walletConfig.appData.id as string,
                name: this.walletConfig.appData.name,
                description: this.walletConfig.appData.description,
                url: this.walletConfig.appData.url as string,
                permissions: this.walletConfig.appData.permissions,
            },

            // The relayer returns connection information to generate QR code.
            // The raw json data is also shown in case the user wants
            // to use that instead of the QR code.
            onQRReady: async (qrData) => {
                log.trace("QR Data", qrData);

                if (qrData === null) {
                    this.qrCodeContainer.innerHTML = '';
                    this.walletErrorContainer.style.display = 'block';
                    this.walletErrorContainer.innerHTML = '<div class="message expire">The QR code has expired. Please try again.</div>';
                    this.qrCodeContainer.appendChild(this.walletErrorContainer);
                    return;
                }

                this.qrCodeContainer.style.display = 'flex';
                this.walletErrorContainer.innerHTML = 'Use your phone to scan the QR code above.';

                // 2. Display QR code along with relayer connection information to user
                const qrOptions = {
                    /** QR code color (default: #000000) */
                    color: this.walletConfig.qrCodeOptions?.color,
                    /** Background color (default: #FFFFFF) */
                    backgroundColor: this.walletConfig.qrCodeOptions?.backgroundColor,
                    centerBackgroundColor: this.walletConfig.qrCodeOptions?.centerBackgroundColor,
                    /** Optional logo to display in center of QR code */
                    logoUrl: this.walletConfig.qrCodeOptions?.logoUrl,
                    /** Logo size as percentage of QR code (default: 0.2 = 20%) */
                    logoSize: this.walletConfig.qrCodeOptions?.logoSize,
                }

                log.trace(`[WalletRemote] Generating QR code for qrData:`, qrData);

                const qrDataUrl = await generateQRCodeDataURL(qrData, qrOptions);

                const qrCodeImage = document.createElement('img');
                qrCodeImage.src = qrDataUrl;
                qrCodeImage.classList.add('qr-code');
                this.qrCodeContainer.appendChild(qrCodeImage);

                this.qrCodeContainer.appendChild(this.walletErrorContainer);

                const qrDataContainer = document.createElement('pre');
                qrDataContainer.classList.add('qr-data-container');
                qrDataContainer.innerHTML = JSON.stringify(qrData, null, 2);

                this.qrCodeContainer.appendChild(qrDataContainer);

                const copyQrDataButton = document.createElement('button');
                copyQrDataButton.classList.add('copy-qr-data-button');
                let buttonTitle = 'Copy QR Data';
                copyQrDataButton.innerHTML = buttonTitle;
                this.qrCodeContainer.appendChild(copyQrDataButton);

                copyQrDataButton.addEventListener('click', () => {
                    navigator.clipboard.writeText(JSON.stringify(qrData));
                    copyQrDataButton.innerHTML = 'Copied!';
                    setTimeout(() => {
                        copyQrDataButton.innerHTML = buttonTitle;
                    }, 2000);
                });
            },

            relayerUrl: this.walletConfig.relayerUrl,

            onConnected: () => {
                log.trace('Wallet connection. Waiting for approval...');
            },

            onClose: () => {
                log.trace('Wallet connection closed!');
                this.walletReady = this.xelisWallet.walletReady = false;
                const wallet_disconnect = new CustomEvent("wallet-disconnect", {
                    detail: { ws: this.client?.socket },
                });
                this.xelisWallet.dispatchEvent(wallet_disconnect);
                walletRemoteOptions.onClose();
            },
        }).then((connection) => {
            // 3. Once the information is confirmed/approved by the user's wallet, the wallet will connect
            this.connection = connection;
            log.trace('[Wallet Remote] Remote Wallet connected!')
            this.client = connection.client as unknown as RelayClient;

            this.client.socket.addEventListener("message", (event: MessageEvent) => {

                let data = JSON.parse(event.data as string);
                log.trace(`[WalletRemote] Message received:`, data);

                if (data.error && data.error.code === -32004) {
                    log.trace('[WalletRemote] Connection error.');
                    alert(`Wallet Error.\nKind:${data.error.kind}\nMessage:${data.error.message}`);
                    return;
                }

                const connection_data_received_event = new CustomEvent("connection-data-received", {
                    detail: { data },
                });

                this.xelisWallet.dispatchEvent(connection_data_received_event);
            });

            //check connection every five seconds
            const interval = setInterval(() => {
                if (this.client?.socket?.readyState !== WebSocket.OPEN) {
                    log.trace('[WalletRemote] Lost connection to wallet...');
                    this.walletReady = this.xelisWallet.walletReady = false;
                    const wallet_disconnect = new CustomEvent("wallet-disconnect", {
                        detail: { ws: this.client?.socket },
                    });
                    this.xelisWallet.dispatchEvent(wallet_disconnect);

                    clearInterval(interval);
                }
            }, 5000);

            walletRemoteOptions.onConnected();

            this.walletReady = this.xelisWallet.walletReady = true;

            const wallet_ready_event = new CustomEvent("wallet-ready", {
                detail: {},
            });

            this.xelisWallet.dispatchEvent(wallet_ready_event);

        });
    }

    public send_query(query: string): void {

        if (this.client?.socket === null) {
            log.trace(`<error><b>Error</b>: Client not connected to a source. Please connect first.</error>`);
            return;
        }

        if (this.client?.socket.readyState !== WebSocket.OPEN) {
            log.trace(`<error><b>Error</b>: Client not connected to a source. Please connect first.</error>`);
            return;
        }

        try {
            let parsed_query = JSON.parse(query);
            parsed_query = JSON.stringify(parsed_query);
            this.client?.socket?.send(parsed_query);
        } catch (error) {
            log.trace(`<error>${error}</error>`);
            log.trace(`<warn>NOTE: Relaxed JSON is unsupported. Use strict JSON only.</warn>`);
        }
    }

    close(): void {
        if (this.connection !== null) {
            this.connection.close();
        }
    }
}
