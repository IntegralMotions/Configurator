import type { ReadDeviceMessage, WriteSettingsRequest, WriteSetting } from "./types"

export const READ_DEVICE_REQUEST: ReadDeviceMessage = {
    msgType: "request",
    opCode: "read.device",
    payload: null,
}

export const createWriteSettingsRequest = (values: WriteSetting[]): WriteSettingsRequest => ({
    msgType: "request",
    opCode: "write.settings",
    payload: {
        values,
    },
})