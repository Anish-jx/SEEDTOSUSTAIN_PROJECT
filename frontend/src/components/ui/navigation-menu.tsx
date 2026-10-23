// NavigationMenu placeholder - not used in this app
import * as React from "react"

export const NavigationMenu = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    (props, ref) => <nav ref={ref} {...props} />
)
export const NavigationMenuList = (props: any) => <ul {...props} />
export const NavigationMenuItem = (props: any) => <li {...props} />
export const NavigationMenuContent = (props: any) => <div {...props} />
export const NavigationMenuTrigger = (props: any) => <button {...props} />
export const NavigationMenuLink = (props: any) => <a {...props} />
export const NavigationMenuIndicator = (props: any) => <div {...props} />
export const NavigationMenuViewport = (props: any) => <div {...props} />
export const navigationMenuTriggerStyle = () => ""
