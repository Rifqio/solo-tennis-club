import { ErrorPage } from '@/features/errors/ErrorPage'

// An unknown admin address, inside the admin shell: the shell keeps the navigation, the page says what happened.
export function Component() {
  return <ErrorPage code={404} audience="admin" header={false} fill={false} />
}
