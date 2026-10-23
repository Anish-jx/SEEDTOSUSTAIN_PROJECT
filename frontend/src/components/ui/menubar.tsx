// Menubar placeholder - not used in this app
import * as React from "react"

export const Menubar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    (props, ref) => <div ref={ref} {...props} />
)
export const MenubarMenu = (props: any) => <div {...props} />
export const MenubarTrigger = (props: any) => <button {...props} />
export const MenubarContent = (props: any) => <div {...props} />
export const MenubarItem = (props: any) => <div {...props} />
export const MenubarSeparator = (props: any) => <div {...props} />
export const MenubarLabel = (props: any) => <div {...props} />
export const MenubarCheckboxItem = (props: any) => <div {...props} />
export const MenubarRadioGroup = (props: any) => <div {...props} />
export const MenubarRadioItem = (props: any) => <div {...props} />
export const MenubarPortal = (props: any) => <>{props.children}</>
export const MenubarSubContent = (props: any) => <div {...props} />
export const MenubarSubTrigger = (props: any) => <div {...props} />
export const MenubarGroup = (props: any) => <div {...props} />
export const MenubarSub = (props: any) => <div {...props} />
export const MenubarShortcut = (props: any) => <span {...props} />
