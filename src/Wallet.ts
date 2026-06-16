import { generateSecureHexString } from "./utils";

export class WalletDefaults {
    public static NODE_DEFAULT_PORT = "8080";
    public static WALLET_DEFAULT_PORT = "8181";
    public static XSWD_PORT = "44325";

    public static MAINNET_NODE_URL = `fr-node.xelis.io`
    public static TESTNET_NODE_URL = `testnet-node.xelis.io`;
    public static LOCAL_NODE_URL = `localhost:${WalletDefaults.NODE_DEFAULT_PORT}`;

    public static MAINNET_NODE_WS = `wss://${WalletDefaults.MAINNET_NODE_URL}/json_rpc`
    public static TESTNET_NODE_WS = `wss://${WalletDefaults.TESTNET_NODE_URL}/json_rpc`
    public static LOCAL_NODE_WS = `ws://${WalletDefaults.LOCAL_NODE_URL}/json_rpc`;

    public static LOCAL_XSWD_URL = `127.0.0.1:${WalletDefaults.XSWD_PORT}`;
    public static LOCAL_XSWD_WS = `ws://${WalletDefaults.LOCAL_XSWD_URL}/xswd`;

    public static XEL_HASH_ID: string = "0000000000000000000000000000000000000000000000000000000000000000";

    public static RELAYER_XELIS = 'wss://relay.xelis.io/ws';
    public static RELAYER_FORGE = 'wss://xswd.neptuun.xyz/ws';

    static appDataWith({ id = generateSecureHexString(64), name = "", description = "", url = WalletDefaults.LOCAL_XSWD_URL, permissions = [] }: { id?: string, name?: string, description?: string, url?: string, permissions?: string[] }): AppData {
        return {
            id,
            name,
            description,
            url,
            permissions
        }
    }

    static qrCodeOptionsWith({ color = "#000000", backgroundColor = "#ffffff", centerBackgroundColor = "#ffffff", logoUrl = "", logoSize = 0.2 }): QrCodeOptions {
        return {
            color,
            backgroundColor,
            centerBackgroundColor,
            logoUrl,
            logoSize
        }
    }
}

export interface AppData {
    id?: string;
    name: string;
    description: string;
    url?: string;
    permissions: string[];
}

export interface QrCodeOptions {
    color: string;
    backgroundColor: string;
    centerBackgroundColor: string;
    logoUrl: string;
    logoSize: number;
}

export interface WalletConfig {
    appData: AppData,
    qrCodeOptions?: QrCodeOptions,
    relayerUrl?: string,
    theme?: string
}

export type MethodCallback = (data: any) => void;
export type InstanceMethodCallbackMap = Map<string, Map<number, MethodCallback>>;

export class WalletMethodID {
    static NEW_TOPO_HEIGHT = 301;
    static GET_TOPOHEIGHT = 302;
    static GET_ADDRESS = 303;
    static GET_BALANCE = 304;
    static XSWD_PREFETCH_PERMISSIONS = 305;
    static GET_ESTIMATED_FEE_RATES = 306;
    static GET_ESTIMATED_FEE_PER_KB = 307;

    static EVENT_WALLET_BALANCE_CHANGED = 500;
    static EVENT_WALLET_RESCAN = 501;

    // special.
    static BUILD_TRANSACTION_ID = 1000;
    static BUILD_TRANSACTION_MAX_IDS = 1000;
    static WALLET_RELAY_CONNECTION_ERROR = -32004;

}

