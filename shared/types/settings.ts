export type SettingValue = boolean | number

export type SettingOption<T extends SettingValue> = {
    value: T
    id: string
}

export type SettingLimits<T extends SettingValue> = {
    min?: number
    max?: number
    step?: number
    isRange: boolean
    options: SettingOption<T>[]
}

export type BaseSetting<T extends SettingValue> = {
    address: number
    id: string
    value: T
    unit?: string
    readonly?: true
    limits: SettingLimits<T>
}

export type NumericSettingType =
    | "i8" | "u8"
    | "i16" | "u16"
    | "i32" | "u32"
    | "i64" | "u64"
    | "f32" | "f64"

export type Setting =
    | { type: "bool", value: BaseSetting<boolean> }
    | { type: NumericSettingType, value: BaseSetting<number> }

export type Group = {
    id: string
    settings: Setting[]
}

export type Module = {
    id: string
    groups: Group[]
}

export type Device = {
    deviceInfo: {
        model: string | null
        firmwareVersion: string | null
    }
    modules: Module[]
}
