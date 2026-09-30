import type { Device, SettingType } from "./settings"

export type MessageOpCode = "read.device" | "write.settings"

export type Message<TPayload> = {
    msgType: "request" | "response" | "event"
    opCode: MessageOpCode
    payload: TPayload
}

export type ReadDeviceMessage = Message<null> & {
    msgType: "request"
    opCode: "read.device"
}

export type ReadDeviceResponse = Message<Device> & {
    msgType: "response"
    opCode: "read.device"
}

export type WriteSetting = {
    address: number
    type: SettingType
    value: {
        value: boolean | number
    }
}

export type WriteSettingsRequest = Message<{ values: WriteSetting[] }> & {
    msgType: "request"
    opCode: "write.settings"
}

export type WriteSettingsResponse = Message<{
    values: Array<{
        address: number
        success: boolean
        errorMessage?: string
    }>
}> & {
    msgType: "response"
    opCode: "write.settings"
}

export type WriteSettingsResultEntry = WriteSettingsResponse["payload"]["values"][number]