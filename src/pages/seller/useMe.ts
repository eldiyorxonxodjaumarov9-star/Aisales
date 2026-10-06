import { useDemo } from '../../store/store'

export function useMe() {
  const { state } = useDemo()
  const me = state.sellers.find((s) => s.id === state.session?.userId)!
  return me
}
