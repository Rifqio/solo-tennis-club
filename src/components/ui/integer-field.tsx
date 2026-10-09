import { TextField } from './text-field'
import type { TextFieldProps } from './text-field'
export function IntegerField(props: TextFieldProps) { return <TextField {...props} type="text" inputMode="numeric" pattern="[0-9]*" /> }
