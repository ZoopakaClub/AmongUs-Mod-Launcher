import * as React from 'react'
import { ModSchema } from 'src/common/ModSchema'
import { Box, Card, CardContent, CardMedia, Typography, ButtonBase, Button, Link } from '@mui/material'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'

interface LaunchButtonProps {
  mod: ModSchema
  current: string
  handler: (mod: ModSchema) => void
}


function ImageItem(props: LaunchButtonProps): JSX.Element {
  const mod: ModSchema = props.mod
  const current: string = props.current
  return (
    <Card
      variant="outlined"
      className={current == mod.prefix ? "current" : ""}
      sx={{
        p: 1,
        display: 'flex',
        overflow: 'inherit',
        backgroundColor: 'rgba(255,255,255,0.1)'
      }}>
      <Box sx={{ width: "100%", display: 'flex' }}>
        <Box sx={{ width: "100%" }}>
          <Typography fontWeight="bold" sx={{fontSize: "0.8em"}} noWrap gutterBottom>
            {mod.title}
          </Typography>
          {mod.url && (
            <Link href={mod.url} color="inherit" sx={{ fontSize: "0.7em" }} target="_blank" >
              公式サイト<OpenInNewIcon sx={{ fontSize: "1em" }} />
            </Link>
          )}
        </Box>
        <Box sx={{ width: "80px" }}>
          <Button variant="contained" size="small" onClick={() => props.handler(mod)}>起動</Button>
        </Box>
      </Box>
    </Card>
  )
}

export default ImageItem
