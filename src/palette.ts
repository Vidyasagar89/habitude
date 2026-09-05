export interface GradientColor {
  name: string
  from: string
  to: string
}

/** Vivid card gradients to choose from when creating a habit. */
export const PALETTE: GradientColor[] = [
  { name: 'Crimson', from: '#ff3b57', to: '#ff7a45' },
  { name: 'Sunset', from: '#ff7a45', to: '#ffb454' },
  { name: 'Rose', from: '#ff5c8a', to: '#ff8fab' },
  { name: 'Grape', from: '#8b5cf6', to: '#c084fc' },
  { name: 'Ocean', from: '#3b82f6', to: '#22d3ee' },
  { name: 'Forest', from: '#22c55e', to: '#84cc16' },
  { name: 'Amber', from: '#f59e0b', to: '#fbbf24' },
  { name: 'Berry', from: '#d946ef', to: '#f472b6' },
]

export function gradientFor(colorIndex: number): string {
  const color = PALETTE[colorIndex % PALETTE.length]
  return `linear-gradient(135deg, ${color.from}, ${color.to})`
}
