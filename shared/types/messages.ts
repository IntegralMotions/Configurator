import type { ReadDeviceMessage } from "./types"

export const READ_DEVICE_REQUEST: ReadDeviceMessage = {
    op: "read.device",
    type: "request",
}
