// Landing-page footer (home page only).
//
// What it shows, top to bottom:
//   1. The motto and a "Create your account" button.
//   2. Artwork: two human hands reaching toward each other, as in Michelangelo's
//      "Creation of Adam" (public domain). A blood-group block hovers between the
//      index fingertips, about to be set into a wall of blood-group blocks below.
//   3. A dark credits strip.
//
// This file is self-contained on purpose: the footer used inside the donor, hospital,
// organizer and admin workspaces (SiteFooter.jsx) is not changed.
import { Link } from 'react-router-dom'
import handLeft from '../assets/hand-left.png'    // Adam's hand, reaching in from the left
import handRight from '../assets/hand-right.png'  // God's hand, reaching in from the right
import './CreationScene.css'

// Shades of red used for the wall blocks, and the eight blood groups shown on them.
const REDS = ['#E0586B', '#D8465A', '#C9243D', '#B81D35', '#931028']
const GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

// Number of blocks stacked in each of the 16 columns. The two short columns in the
// middle leave a gap where the hovering block will be placed.
const WALL = [3, 3, 3, 3, 3, 3, 2, 1, 1, 2, 3, 3, 3, 3, 3, 3]

// Drawing size, in SVG units: each block is 75 x 46 and the whole scene is 1200 x 480.
const W = 75, H = 46, SCENE_H = 480

// Draws the wall, bottom row first. Each block gets a red shade and a faint blood-group label.
function Wall() {
  const out = []
  WALL.forEach((count, col) => {
    for (let row = 0; row < count; row++) {
      const y = SCENE_H - (row + 1) * H
      out.push(
        <g key={`${col}-${row}`}>
          <rect x={col * W + 2} y={y + 2} width={W - 4} height={H - 4} rx="4"
            fill={REDS[(col * 7 + row * 3) % REDS.length]} />
          <text x={col * W + W / 2} y={y + H / 2 + 5} textAnchor="middle"
            fontSize="15" fontWeight="700" fill="#fff" opacity=".3">
            {GROUPS[(col + row * 3) % 8]}
          </text>
        </g>
      )
    }
  })
  return <>{out}</>
}

export default function CreationScene() {
  return (
    <footer className="cs">
      {/* 1. Motto and call to action */}
      <div className="cs-top">
        <h2 className="cs-motto">Every donation is someone's second chance.</h2>
        <p className="cs-sub">Every donor adds one more block to a stronger community.</p>
        <Link className="cs-btn" to="/register">Create your account</Link>
      </div>

      {/* 2. Artwork. The SVG scales with the page width. */}
      <svg className="cs-scene" viewBox={`0 0 1200 ${SCENE_H}`} preserveAspectRatio="xMidYMax meet" role="img"
        aria-label="Two human hands reaching toward each other with a blood group block between their fingertips">
        <Wall />

        {/* Left hand. The forearm runs off the left edge and the index fingertip stops at x = 520. */}
        <image href={handLeft} x="-49.6" y="43.1" width="572.8" height="275.2" />

        {/* Right hand. The forearm runs off the right edge and the index fingertip stops at x = 680,
            slightly higher than the left one, like in the fresco. */}
        <image href={handRight} x="680" y="23.2" width="587.2" height="278.4" />

        {/* The block between the fingertips: a soft glow, then the white block with its label. */}
        <circle cx="600" cy="167.5" r="66" fill="#fff" opacity=".14" />
        <rect x="558" y="137.5" width="84" height="60" rx="8" fill="#fff" />
        <text x="600" y="177.5" textAnchor="middle" fontSize="28" fontWeight="800" fill="#A5132E">O-</text>
      </svg>

      {/* 3. Credits strip */}
      <div className="cs-bar">
        <span><b>Bloodbound</b> - Blood Donor and Donation Camp Coordination System</span>
        <span className="cs-love">
          Made with
          {/* small heart icon */}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="#FF9AAA" aria-hidden="true">
            <path d="M12 21s-7.5-4.6-9.6-9.4C.9 8.2 3 4.5 6.6 4.5c2 0 3.6 1 5.4 3.1 1.8-2.1 3.4-3.1 5.4-3.1 3.6 0 5.7 3.7 4.2 7.1C19.5 16.4 12 21 12 21z" />
          </svg>
          by Areeba, Rani &amp; Wajeeh
        </span>
      </div>
    </footer>
  )
}
