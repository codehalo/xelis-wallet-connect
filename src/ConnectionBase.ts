export const ChainConnectionType = {
    rpc: '',
    xswd: 'node.',
} as const;

export type ChainConnectionType = typeof ChainConnectionType[keyof typeof ChainConnectionType];

// Connections must be XSWD or Direct RPC
export interface ConnectionBase extends EventTarget {
    chainConnectionType: ChainConnectionType;
    send_query(data: string): void;
    connected: boolean;
}
