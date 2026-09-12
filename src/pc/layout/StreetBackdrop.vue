<script setup>
const ROW_COUNT = 9
const lamps = buildLamps()

function buildLamps() {
  const posts = []

  for (let i = 0; i < ROW_COUNT; i += 1) {
    const t = i / (ROW_COUNT - 1)
    const ease = 1 - (1 - t) ** 1.45
    const scale = 1.02 - ease * 0.88
    const bottom = 1.2 + ease * 61
    const spread = 47.2 - ease * 25.8
    const opacity = 1 - ease * 0.45

    for (const side of ['left', 'right']) {
      const offset = side === 'left' ? `-${spread}vw` : `${spread}vw`
      posts.push({
        id: `${side}-${i}`,
        side,
        row: i,
        style: {
          bottom: `${bottom}%`,
          left: `calc(50% + ${offset})`,
          zIndex: String(ROW_COUNT - i),
          opacity: String(opacity),
          '--lamp-scale': String(scale),
        },
      })
    }
  }

  return hangCapitalists(posts)
}

function hangCapitalists(posts) {
  const pick = (side) => {
    const pool = posts.filter((post) => post.side === side && post.row >= 0 && post.row <= 3)
    const count = 2 + (Math.random() > 0.35 ? 1 : 0)
    return [...pool].sort(() => Math.random() - 0.5).slice(0, count)
  }

  const selected = [...pick('left'), ...pick('right')]
  const hangingById = new Map(
    selected.map((post, index) => [
      post.id,
      {
        variant: ['navy', 'wine', 'ink'][index % 3],
        delay: `${((index * 0.47) % 2.1).toFixed(2)}s`,
        duration: `${(2.6 + (index % 4) * 0.35).toFixed(2)}s`,
      },
    ]),
  )

  return posts.map((post) => ({
    ...post,
    hanging: hangingById.get(post.id) ?? null,
  }))
}
</script>

<template>
  <div class="street-backdrop" aria-hidden="true">
    <div class="sky"></div>
    <div class="skyline"></div>
    <div class="vanishing-glow"></div>

    <div class="perspective-world">
      <div class="ground">
        <div class="sidewalk sidewalk-left"></div>
        <div class="asphalt"></div>
        <div class="sidewalk sidewalk-right"></div>
        <div class="center-dashes"></div>
      </div>
    </div>

    <div class="ground-fog"></div>
    <div class="vignette"></div>

    <div
      v-for="lamp in lamps"
      :key="lamp.id"
      class="lamp"
      :class="[lamp.side, { occupied: Boolean(lamp.hanging), near: lamp.row < 2 }]"
      :style="lamp.style"
    >
      <div class="lamp-visual">
        <div class="lamp-base"></div>
        <div class="lamp-pole"></div>
        <div class="lamp-collar"></div>
        <div class="lamp-arm">
          <span class="lamp-hook"></span>
          <span class="lamp-lantern">
            <span class="lamp-bulb"></span>
          </span>
          <span class="lamp-halo"></span>
        </div>

        <div
          v-if="lamp.hanging"
          class="hanged-capitalist"
          :class="lamp.hanging.variant"
          :style="{
            animationDelay: lamp.hanging.delay,
            animationDuration: lamp.hanging.duration,
          }"
        >
          <span class="rope"></span>
          <svg class="capitalist" viewBox="0 0 88 148" fill="none">
            <path d="M44 0v26" stroke="#3A2A22" stroke-width="3" stroke-linecap="round" />
            <ellipse cx="44" cy="30" rx="6" ry="4" stroke="#3A2A22" stroke-width="3" />
            <g transform="rotate(-14 44 40)">
              <rect x="30" y="12" width="28" height="18" rx="2" fill="#24212E" stroke="#522719" stroke-width="2.6" />
              <rect x="26" y="28" width="36" height="6" rx="2" fill="#24212E" stroke="#522719" stroke-width="2.6" />
              <rect x="30" y="25" width="28" height="5" fill="#A82F35" />
            </g>
            <circle cx="44" cy="52" r="14" fill="#F3AA73" stroke="#522719" stroke-width="2.8" />
            <ellipse cx="38" cy="56" rx="5" ry="4" fill="#EF8E67" opacity=".7" />
            <ellipse cx="51" cy="56" rx="5" ry="4" fill="#EF8E67" opacity=".7" />
            <text x="33.5" y="56" fill="#3B8B48" font-size="11" font-weight="900">$</text>
            <text x="45.5" y="56" fill="#3B8B48" font-size="11" font-weight="900">$</text>
            <path
              d="M44 64c-16 3-20 12-22 28l-4 28c8 8 20 11 26 11s18-3 26-11l-4-28c-2-16-6-25-22-28Z"
              class="suit"
              stroke="#522719"
              stroke-width="2.8"
              stroke-linejoin="round"
            />
            <path d="M44 66 39 84l5 7 5-7Z" fill="#FFF3D2" stroke="#522719" stroke-width="1.8" />
            <path d="m44 84-4 8 4 6 4-6Z" fill="#B92F38" />
            <path d="M32 76c-9 8-14 18-12 28" stroke="#F3AA73" stroke-width="6.5" stroke-linecap="round" />
            <path d="M56 76c9 8 14 18 12 28" stroke="#F3AA73" stroke-width="6.5" stroke-linecap="round" />
            <path d="M38 118c-4 12-8 20-14 26" stroke="currentColor" stroke-width="7" stroke-linecap="round" />
            <path d="M50 118c5 11 10 20 16 26" stroke="currentColor" stroke-width="7" stroke-linecap="round" />
            <circle cx="62" cy="108" r="9" fill="#E8B73D" stroke="#522719" stroke-width="2.2" />
            <text x="57" y="112" fill="#6B4014" font-size="11" font-weight="900">$</text>
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.street-backdrop {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  background: #12100e;
}

.sky {
  position: absolute;
  inset: 0 0 36% 0;
  background:
    radial-gradient(ellipse 90% 42% at 50% 100%, rgba(196, 122, 42, 0.28), transparent 72%),
    linear-gradient(180deg, #0d0c0b 0%, #161310 48%, #2a2218 100%);
}

.skyline {
  position: absolute;
  left: 50%;
  top: 26%;
  width: 22%;
  height: 11%;
  transform: translateX(-50%);
  opacity: 0.42;
  background: #0c0b0a;
  clip-path: polygon(
    0% 100%,
    0% 62%,
    6% 62%,
    6% 38%,
    14% 38%,
    14% 52%,
    18% 52%,
    18% 18%,
    28% 18%,
    28% 44%,
    36% 44%,
    36% 28%,
    48% 28%,
    48% 8%,
    58% 8%,
    58% 36%,
    70% 36%,
    70% 22%,
    82% 22%,
    82% 48%,
    90% 48%,
    90% 58%,
    100% 58%,
    100% 100%
  );
}

.vanishing-glow {
  position: absolute;
  left: 50%;
  top: 34%;
  width: 28vw;
  height: 18vh;
  transform: translate(-50%, -50%);
  background: radial-gradient(ellipse at center, rgba(244, 197, 109, 0.22), transparent 68%);
}

.perspective-world {
  position: absolute;
  inset: 0;
  overflow: hidden;
  perspective: 170px;
  perspective-origin: 50% 35%;
}

.ground {
  position: absolute;
  left: -40%;
  bottom: -58%;
  width: 180%;
  height: 145%;
  transform: rotateX(72deg);
  transform-origin: 50% 50%;
  background:
    repeating-linear-gradient(
      90deg,
      rgba(255, 214, 140, 0.03) 0 2px,
      transparent 2px 42px
    ),
    #1a1612;
}

.asphalt {
  position: absolute;
  left: 50%;
  top: 0;
  width: 36%;
  height: 100%;
  transform: translateX(-50%);
  background:
    linear-gradient(90deg, rgba(0, 0, 0, 0.28), transparent 8% 92%, rgba(0, 0, 0, 0.28)),
    linear-gradient(90deg, #4a4034 0%, #2c2823 7%, #23201c 50%, #2c2823 93%, #4a4034 100%);
}

.sidewalk {
  position: absolute;
  top: 0;
  width: 18%;
  height: 100%;
  background:
    repeating-linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.03) 0 18px,
      transparent 18px 56px
    ),
    #3a342c;
}

.sidewalk-left {
  left: 14%;
  border-right: 3px solid #5a5044;
}

.sidewalk-right {
  right: 14%;
  border-left: 3px solid #5a5044;
}

.center-dashes {
  position: absolute;
  left: 50%;
  top: 0;
  width: 10px;
  height: 100%;
  transform: translateX(-50%);
  background: repeating-linear-gradient(#e6d394 0 46px, transparent 46px 108px);
  opacity: 0.85;
}

.lamp {
  position: absolute;
  width: 168px;
  height: 300px;
  margin-left: -28px;
  transform: scale(var(--lamp-scale));
  transform-origin: 28px 100%;
}

.lamp.right {
  transform: scale(calc(var(--lamp-scale) * -1), var(--lamp-scale));
}

.lamp-visual {
  position: relative;
  width: 100%;
  height: 100%;
}

.lamp-base {
  position: absolute;
  left: 10px;
  bottom: 0;
  width: 36px;
  height: 14px;
  background: linear-gradient(180deg, #3a342c, #141210);
  clip-path: polygon(12% 0, 88% 0, 100% 100%, 0 100%);
}

.lamp-pole {
  position: absolute;
  left: 23px;
  bottom: 12px;
  width: 8px;
  height: 238px;
  background: linear-gradient(90deg, #141210, #4a433a 42%, #1c1916 100%);
  box-shadow: 2px 0 0 rgba(255, 214, 140, 0.08);
}

.lamp-collar {
  position: absolute;
  left: 18px;
  top: 40px;
  width: 18px;
  height: 10px;
  border-radius: 2px;
  background: #c4a056;
  box-shadow: inset 0 -2px 0 #7a6228;
}

.lamp-arm {
  position: absolute;
  left: 27px;
  top: 12px;
  width: 118px;
  height: 58px;
  border: 7px solid #1a1714;
  border-bottom: 0;
  border-left: 0;
  border-radius: 0 52px 0 0;
}

.lamp-hook {
  position: absolute;
  right: -8px;
  bottom: -6px;
  width: 8px;
  height: 12px;
  border-right: 3px solid #1a1714;
  border-bottom: 3px solid #1a1714;
  border-radius: 0 0 6px 0;
}

.lamp-lantern {
  position: absolute;
  right: -18px;
  bottom: -34px;
  width: 22px;
  height: 30px;
  background: linear-gradient(180deg, #fff1b0, #f0b84a 42%, #c98418);
  clip-path: polygon(18% 0, 82% 0, 100% 16%, 86% 100%, 14% 100%, 0 16%);
  box-shadow:
    0 0 16px 4px rgba(244, 197, 109, 0.55),
    inset 0 0 8px rgba(255, 255, 220, 0.7);
}

.lamp-bulb {
  position: absolute;
  inset: 6px 5px 8px;
  border-radius: 40% 40% 30% 30%;
  background: #fff8d2;
}

.lamp-halo {
  position: absolute;
  right: -52px;
  bottom: -76px;
  width: 92px;
  height: 92px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(244, 197, 109, 0.38) 0%, transparent 68%);
}

.hanged-capitalist {
  position: absolute;
  left: 128px;
  top: 68px;
  width: 64px;
  transform-origin: 28px 0;
  animation: sway 3.2s ease-in-out infinite;
}

.rope {
  position: absolute;
  left: 27px;
  top: -10px;
  width: 2px;
  height: 16px;
  background: #3a2a22;
}

.capitalist {
  display: block;
  width: 64px;
  height: auto;
  overflow: visible;
  filter: drop-shadow(0 6px 4px rgba(0, 0, 0, 0.45));
}

.capitalist .suit {
  fill: #2a2733;
}

.hanged-capitalist.wine {
  color: #2a1718;
}

.hanged-capitalist.wine .suit {
  fill: #4a1c1c;
}

.hanged-capitalist.navy {
  color: #1a1c28;
}

.hanged-capitalist.navy .suit {
  fill: #1e2a38;
}

.hanged-capitalist.ink {
  color: #17161c;
}

.hanged-capitalist.ink .suit {
  fill: #24212e;
}

.ground-fog {
  position: absolute;
  inset: auto 0 0;
  height: 28%;
  background: linear-gradient(180deg, transparent, rgba(18, 16, 14, 0.55));
}

.vignette {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 50% 58%, transparent 42%, rgba(8, 7, 6, 0.42) 100%),
    linear-gradient(90deg, rgba(8, 7, 6, 0.18), transparent 16% 84%, rgba(8, 7, 6, 0.18));
}

@keyframes sway {
  0%,
  100% {
    transform: rotate(-7deg);
  }

  50% {
    transform: rotate(8deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .hanged-capitalist {
    animation: none;
  }
}

@media (max-width: 900px) {
  .lamp:not(.near) {
    display: none;
  }
}
</style>
