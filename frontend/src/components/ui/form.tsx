// Form placeholder - not used in this app (using native forms)
import * as React from "react"

export const Form = (props: any) => <form {...props} />
export const FormField = (props: any) => <div {...props} />
export const FormItem = (props: any) => <div {...props} />
export const FormLabel = (props: any) => <label {...props} />
export const FormControl = (props: any) => <div {...props} />
export const FormDescription = (props: any) => <p {...props} />
export const FormMessage = (props: any) => <p {...props} />
export const useFormField = () => ({ error: null, formItemId: '', formDescriptionId: '', formMessageId: '' })
