import { styled } from '@mui/material/styles'
import { ModSchema } from 'src/common/ModSchema'

import LaunchButton from './LaunchButton'

const ButtonList = styled('div')({
  position: 'relative',
  display: 'flex',
  width: '100%',
  height: '100%',
  gap: '18px',
  flexWrap: 'wrap'
})

interface LaunchListProps {
  mods: ModSchema[]
  handler: (mod: ModSchema) => void
}

function LaunchList(props: LaunchListProps): JSX.Element {
  const list: ModSchema[] = props.mods
  const elements = list.map((d) => (
    <LaunchButton key={d.prefix} mod={d} handler={(mod) => props.handler(mod)} />
  ))

  return <ButtonList>{elements}</ButtonList>
}

export default LaunchList
