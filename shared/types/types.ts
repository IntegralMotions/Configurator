import type { Device, SuccessResult } from "./settings"

export type MessageOpCode = "read.device" | "write.device" | ""

export type Message<TPayload = any> = {
    op: string
    type: "request" | "response" | "event"
    payload?: TPayload
}

export type ReadDeviceMessage = Message<undefined> & {
    op: "read.device"
    type: "request"
}

export type ReadDeviceResponse = Message<Device> & {
    op: "read.device",
    type: "response"
}

export type WriteDeviceMessage = Message<Device> & {
    op: "write.device"
    type: "request"
}

export type WriteDeviceResult = Message<SuccessResult> & {
    op: "write.device",
    type: "response"
}