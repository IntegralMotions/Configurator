type BaseSetting<T, U extends string> = {
    address: number,
    id: string
    label: string
    type: U
    value: T
    unit?: string
    readonly?: boolean
}

export type BoolSetting = BaseSetting<boolean, "bool">

export type NumberSetting = BaseSetting<number, "int" | "float" | "range"> & {
    min?: number
    max?: number
    step?: number
}

export type StringSetting = BaseSetting<string, "string">

export type OptionsSetting = BaseSetting<string | number, "options"> & {
    options: (string | number)[]
}

export type Setting = BoolSetting | NumberSetting | StringSetting | OptionsSetting
export type Group = { id: string; label: string; settings: Setting[] }
export type Module = { id: string, label: string, groups: Group[] }
export type Device = { deviceInfo?: { model?: string; fw?: string }, modules: Module[] }

export type SuccessResult = { success: boolean, errorMessage?: string }