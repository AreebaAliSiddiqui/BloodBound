// Original block-building artwork: a wall of blood-group blocks and two hands placing the next ones.
const REDS = ['#E0586B', '#D8465A', '#C9243D', '#B81D35', '#931028']
const GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const WALL = [3, 3, 3, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 3, 3, 3]
const SKIN = '#F4CDBE'
const SHADE = '#E3AB98'

function Cells({ heights, w, h, base, fs }) {
  const out = []
  heights.forEach((n, c) => {
    for (let r = 0; r < n; r++) {
      const y = base - (r + 1) * h
      out.push(
        <g key={`${c}-${r}`}>
          <rect x={c * w + 2} y={y + 2} width={w - 4} height={h - 4} rx="4" fill={REDS[(c * 7 + r * 3) % REDS.length]} />
          <text x={c * w + w / 2} y={y + h / 2 + fs / 3} textAnchor="middle" fontSize={fs} fontWeight="700" fill="#fff" opacity=".3">
            {GROUPS[(c + r * 3) % 8]}
          </text>
        </g>
      )
    }
  })
  return <>{out}</>
}

export function BlockGrid({ heights = [1, 2, 2, 3, 3, 2, 3, 4, 4, 3], w = 40, h = 26, className = '' }) {
  const H = Math.max(...heights) * h
  return (
    <svg className={className} viewBox={`0 0 ${heights.length * w} ${H}`} aria-hidden="true">
      <Cells heights={heights} w={w} h={h} base={H} fs={11} />
    </svg>
  )
}

function Hand() {
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <line x1="-20" y1="128" x2="118" y2="122" stroke={SKIN} strokeWidth="56" />
      <line x1="-20" y1="148" x2="118" y2="144" stroke={SHADE} strokeWidth="10" opacity=".7" />
      <path d="M0 118 C40 110 80 118 126 112" stroke="#A5132E" strokeWidth="1.6" opacity=".6" />
      <rect x="66" y="92" width="24" height="68" rx="6" fill="#B81D35" stroke="none" transform="rotate(-3 78 126)" />
      <ellipse cx="140" cy="122" rx="38" ry="32" fill={SKIN} stroke="none" />
      <path d="M156 138 Q184 150 192 168" stroke={SKIN} strokeWidth="16" />
      <path d="M150 108 Q198 90 232 108" stroke={SKIN} strokeWidth="20" />
      <path d="M150 140 Q198 160 232 142" stroke={SKIN} strokeWidth="20" />
      <path d="M150 146 Q198 166 232 148" stroke={SHADE} strokeWidth="3" opacity=".6" />
    </g>
  )
}

function Block({ x, y, label }) {
  return (
    <g>
      <rect x={x} y={y} width="107" height="76" rx="8" fill="#E0586B" />
      <text x={x + 53} y={y + 48} textAnchor="middle" fontSize="30" fontWeight="800" fill="#fff">{label}</text>
    </g>
  )
}

export function FooterScene() {
  return (
    <svg className="sf-scene" viewBox="0 0 1200 340" preserveAspectRatio="xMidYMax meet" role="img"
      aria-label="Two hands placing blood group blocks to build a wall">
      <Cells heights={WALL} w={75} h={46} base={340} fs={15} />
      <rect x="565" y="246" width="70" height="44" rx="6" fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="7 6" opacity=".6" />
      <Block x={429} y={70} label="AB+" />
      <Block x={664} y={70} label="O-" />
      <g transform="translate(0 -128) scale(1.9)"><Hand /></g>
      <g transform="translate(1200 -128) scale(-1.9 1.9)"><Hand /></g>
    </svg>
  )
}
