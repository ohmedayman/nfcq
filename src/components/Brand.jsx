import Logo from './Logo'

export default function Brand({ size = '36px', light = true, showText = true }) {
  return <Logo markSize={parseFloat(size) || 36} light={light} showText={showText} />
}