import * as React from 'react'
import { styled } from '@mui/material/styles'
import ButtonBase from '@mui/material/ButtonBase'
import { ModSchema } from 'src/common/ModSchema'

const ImageButton = styled(ButtonBase)(() => ({
  position: 'relative',
  display: 'flex',
  height: 140,
  width: '30%',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(250, 250, 250, 0.15)',
  '&:hover, &.Mui-focusVisible': {
    zIndex: 1,
    '& .MuiImageBackdrop-root': {
      opacity: 0.15
    },
    '& .MuiImageMarked-root': {
      opacity: 0
    },
    '& .MuiTypography-root': {
      border: '4px solid currentColor',
    }
  }
}))
/*
const ImageSrc = styled('span')({
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  backgroundSize: 'cover',
  backgroundPosition: 'center 40%'
})
*/

const ImageBackdrop = styled('span')(({ theme }) => ({
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  backgroundColor: theme.palette.common.black,
  opacity: 0.2,
  transition: theme.transitions.create('opacity')
}))

const ImageLabel = styled('div')({
  position: 'absolute',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontWeight: 'bold',
  fontSize: '1rem',
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  backgroundSize: 'cover',
  backgroundPosition: 'center 40%'
})

const MultiLineBody = ({ body }: { body: string }) => {
  const texts = body.split('\n').map((item, index) => {
    return (
      <React.Fragment key={index}>
        {item}
        <br />
      </React.Fragment>
    )
  })
  return <div>{texts}</div>
}

interface LaunchButtonProps {
  mod: ModSchema
  handler: (mod: ModSchema) => void
}

function LaunchButton(props: LaunchButtonProps): JSX.Element {
  const mod: ModSchema = props.mod
  return (
    <ImageButton focusRipple onClick={() => props.handler(mod)}>
      <ImageBackdrop className="MuiImageBackdrop-root" />
      <ImageLabel>
        <MultiLineBody body={mod.title} />
      </ImageLabel>
    </ImageButton>
  )
}

export default LaunchButton
