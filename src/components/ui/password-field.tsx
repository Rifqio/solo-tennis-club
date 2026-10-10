import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { IconButton } from './button'
import { TextField } from './text-field'
import type { TextFieldProps } from './text-field'

export function PasswordField({ showLabel, hideLabel, ...props }: Omit<TextFieldProps, 'type' | 'inlineAction'> & { showLabel: string; hideLabel: string }) {
  const [visible, setVisible] = useState(false)
  return <TextField {...props} type={visible ? 'text' : 'password'} inlineAction={
    <IconButton label={visible ? hideLabel : showLabel} aria-pressed={visible} onClick={() => setVisible(value => !value)}>
      {visible ? <EyeOff aria-hidden="true" className="size-6" /> : <Eye aria-hidden="true" className="size-6" />}
    </IconButton>
  } />
}
