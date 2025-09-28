export interface AutoUpdateSchema {
    state: "checking" | "latest" | "available" | "error"
    error?: Error
}