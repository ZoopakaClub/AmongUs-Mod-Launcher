import { styled } from '@mui/material/styles'
import { ModSchema } from 'src/common/ModSchema'

import LaunchItem from './LaunchItem'

const ButtonList = styled('div')({
  position: 'relative',
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  width: '100%',
  height: '100%',
  gap: '8px'
})

interface LaunchListProps {
  mods: ModSchema[]
  current: string
  handler: (mod: ModSchema) => void
}

function LaunchList(props: LaunchListProps): JSX.Element {
  const list: ModSchema[] = props.mods
  const current = props.current
  const elements = list.map((d) => (
    <LaunchItem key={d.prefix} mod={d} current={current} handler={(mod) => props.handler(mod)} />
  ))

  return <ButtonList id='launchList'>{elements}</ButtonList>
}

export default LaunchList
