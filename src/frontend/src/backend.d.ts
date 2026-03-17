import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export type Time = bigint;
export interface CurrencyPair {
    forex: boolean;
    base: string;
    quote: string;
}
export interface Trade {
    id: bigint;
    pnl: number;
    direction: string;
    rewardAmount: number;
    date: Time;
    riskAmount: number;
    pair: CurrencyPair;
    pips: number;
    fileAttachment?: ExternalBlob;
    notes: string;
    entryPrice: number;
    exitPrice: number;
    lotSize: number;
}
export interface ChecklistItem {
    id: bigint;
    title: string;
    isChecked: boolean;
}
export interface DailyLimit {
    date: Time;
    isActive: boolean;
    lossLimit: number;
    profitTarget: number;
}
export interface UserProfile {
    timezone?: string;
    name: string;
    email?: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addChecklistItem(item: ChecklistItem): Promise<void>;
    addTrade(trade: Trade): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    calculatePips(pair: CurrencyPair, entryPrice: number, exitPrice: number, lotSize: number): Promise<number>;
    calculateWinRateAndRiskReward(tradesArray: Array<Trade>): Promise<{
        averageRiskReward: number;
        winRate: number;
    }>;
    findBestAndWorstTrades(tradesArray: Array<Trade>): Promise<{
        bestTrade?: Trade;
        worstTrade?: Trade;
    }>;
    getAllTrades(): Promise<Array<Trade>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getChecklist(): Promise<Array<ChecklistItem>>;
    getCurrencyPairs(): Promise<Array<CurrencyPair>>;
    getDailyLimit(): Promise<DailyLimit | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    hasDailyLimit(): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    resetAllChecks(): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setDailyLimit(limit: DailyLimit): Promise<void>;
}
