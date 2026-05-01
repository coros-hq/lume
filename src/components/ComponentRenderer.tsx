import { ComponentCall } from '../core/componentParser'
import { ComponentDefinition } from '../types'

interface Props {
  response: ComponentCall
  components: ComponentDefinition[] | undefined
}

export function ComponentRenderer({ response, components }: Props) {
  const definition = components?.find(c => c.type === response.component)
  if (!definition) return null
  return <>{definition.render(response.props)}</>
}