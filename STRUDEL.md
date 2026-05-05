# Strudel Complete Reference

Strudel is a web-based live coding music environment that runs in the browser. It's a JavaScript port of TidalCycles (Haskell-based pattern language). Created by Alex McLean and Felix Roos in 2022. Available at https://strudel.cc

---

## Getting Started

- Browser-based, no installation required
- Interactive REPL: edit patterns and hear results in real-time
- `ctrl+enter` to play, `ctrl+.` to stop
- Still experimental / subject to changes

---

## Mini-Notation

The core compact syntax for writing rhythmic patterns:

| Syntax | Purpose | Example |
|--------|---------|---------|
| spaces | Sequence events in one cycle | `"bd sd hh hh"` |
| `~` or `-` | Rest/silence | `"bd ~ sd ~"` |
| `[]` | Sub-sequence (subdivide time) | `"bd [hh hh] sd hh"` |
| `[[]]` | Nested sub-sequences | `"bd [[hh hh] hh] sd"` |
| `<>` | Alternate per cycle | `"<bd sd> hh"` |
| `*` | Speed up / multiply | `"bd*4"` or `"[c e g]*2"` |
| `/` | Slow down / divide | `"[c e g b]/2"` |
| `,` | Polyphony (simultaneous) | `"[c3,e3,g3]"` |
| `@` | Elongate (weight) | `"c@3 e"` (c is 3x longer) |
| `!` | Replicate without speeding | `"c!3 e"` (c appears 3 times) |
| `?` | Random removal (50% default) | `"bd? sd"` or `"bd?0.1"` |
| `\|` | Random choice | `"bd \| sd"` |
| `(n,k)` | Euclidean rhythm | `"bd(3,8)"` = 3 hits in 8 slots |
| `(n,k,r)` | Euclidean with rotation | `"bd(3,8,1)"` |
| `:` | Sample selection | `"hh:2"` selects 3rd sample |

### Euclidean Rhythms
`event(beats,segments,offset)` distributes beats algorithmically across segments.
- `"bd(3,8,0)"` – 3 beats over 8 segments (Pop Clave rhythm)

---

## Sounds & Samples

### Playing Sounds
```js
sound("bd sd hh oh")
s("bd sd hh oh")  // shorthand
```

### Drum Abbreviations
- `bd` bass drum, `sd` snare, `rim` rimshot, `cp` clap
- `hh` closed hi-hat, `oh` open hi-hat
- `lt/mt/ht` low/mid/high toms
- `rd` ride, `cr` crash
- `sh` shakers, `cb` cowbell, `tb` tambourine

### Sound Banks
```js
sound("bd sd").bank("RolandTR909")
// Others: AkaiLinn, RhythmAce, RolandTR808, RolandTR707, ViscoSpaceDrum
```

### Sample Selection
```js
sound("casio:1")       // select by index in mini-notation
n("0 1 4 2").sound("jazz")  // select with n()
```

### Loading Custom Samples
```js
samples('github:user/repo')
samples({ name: 'url/to/sample.wav' })
// strudel.json files supported with optional _base key
```

### Sampler Effects

| Effect | Purpose |
|--------|---------|
| `begin`/`end` | Trim sample start/end points (0-1) |
| `loop` | Enable looping |
| `loopBegin`/`loopEnd` | Define loop region |
| `cut` | Stop samples (drum-machine choke groups) |
| `clip` | Stretch/truncate to duration |
| `chop` | Granular synthesis (fragment into n pieces) |
| `slice`/`splice` | Segment samples with pattern control |
| `speed` | Playback rate (negative = reverse) |
| `striate` | Progressive slice triggering |
| `scrub` | Tape-loop style position control |
| `fit`/`loopAt` | Sync rhythmic loops to cycle tempo |

---

## Synthesizers

### Basic Waveforms
```js
note("c3 e3 g3").sound("sine")
note("c3 e3 g3").sound("sawtooth")
note("c3 e3 g3").sound("square")
note("c3 e3 g3").sound("triangle")  // default when sound omitted
```

### Noise Sources
- `white`, `pink`, `brown` – noise types (harsh to soft)
- `crackle` – subtle noise artifacts (use `density` param)
- Any oscillator can add noise via the `noise` parameter

### Additive Synthesis
- **partials** – control magnitude of each harmonic
- **phases** – set phase offset of individual harmonics
- Use `user` sound source to build waveforms from scratch

### Vibrato
```js
note("c3").vib(6)        // 6 Hz vibrato
note("c3").vibmod(0.5)   // vibrato depth in semitones
```

### FM Synthesis
```js
note("c3").sound("sine")
  .fmh(2)          // harmonicity ratio (integers = natural, decimals = metallic)
  .fmattack(0.01)  // FM envelope attack
  .fmdecay(0.2)    // FM envelope decay
  .fmsustain(0.3)  // FM sustain level
  .fmenv("exponential")  // envelope ramp type
```

### Wavetable Synthesis
- 1000+ waveforms from AKWF set pre-loaded
- Prefix samples with `wt_` to load as wavetables
- Use `loopBegin`/`loopEnd` for scanning

### ZZFX
Compact retro sound synthesis engine with 20 parameters.

---

## Notes & Pitch

### Note Formats
```js
note("48 52 55 59")          // MIDI numbers
note("c3 e3 g3 b3")         // letter notation
note("A4 C#5 E5 A5")        // with sharps
note("Bb3 Eb4")             // with flats
freq("200 300 400 500")     // raw frequency in Hz
```

### MIDI Number Reference
- A4 = MIDI 69 = 440Hz
- Octave = 12 semitones = frequency doubles

### Scales
```js
n("0 1 2 3 4 5 6 7").scale("C:major")
n("0 2 4 6").scale("A2:minor")
// Supported: major, minor, dorian, mixolydian, pentatonic, etc.
```

### Transpose
```js
note("c3 e3 g3").transpose(7)           // shift by semitones
note("0 2 4").scale("C:major").scaleTranspose(2)  // shift by scale steps
```

---

## Chords & Voicings

### Chord Symbols
Standard symbols: C, Am, G7, Bb^7, F#m7b5, Dm9, etc.

### The voicing() Function
```js
chord("<C Am F G>").voicing()
```
Automates smooth voice leading between chords.

### Voicing Parameters
- **anchor** – note to align voicings to (default: highest note)
- **mode** – `below` (default), `above`, `duck`, `root`
- **n** – select individual notes from voicings
- **dict** – voicing dictionary to use

### Custom Voicing Dictionaries
```js
addVoicings('house', {'': ['7 12 16'], 'm': ['0 3 7']})
```

### Root Notes
```js
chord("<C Am F G>").rootNotes(2)  // bass notes at octave 2
```

---

## Audio Effects

### Filters
```js
note("c3 e3").lpf(800)     // low-pass filter (cutoff Hz)
note("c3 e3").hpf(400)     // high-pass filter
note("c3 e3").bpf(1000)    // band-pass filter
note("c3 e3").vowel("a e i o u")  // formant filter
```
Each filter accepts a Q/resonance value as second parameter.

### Amplitude
```js
.gain(0.8)          // exponential volume
.velocity(0.5)      // linear volume (0-1)
.postgain(1.2)      // volume after effects
```

### ADSR Envelope
```js
note("c3").attack(0.1).decay(0.2).sustain(0.5).release(0.3)
note("c3").adsr(".1:.1:.5:.2")  // shorthand
```
Also: `lpenv`, `hpenv`, `bpenv` (filter envelopes), `penv` (pitch envelope)

### Delay
```js
.delay(0.5)                    // amount 0-1
.delaytime(0.25)              // time between echoes
.delayfeedback(0.6)           // decay amount
```

### Reverb
```js
.room(0.8)          // room size
.roomfade(0.5)      // reverb fade
.roomlp(8000)       // reverb filter
```

### Distortion & Waveshaping
```js
.distort(0.5)       // wave-shaping distortion
.coarse(8)          // sample-rate reduction
.crush(4)           // bit-depth reduction
.shape(0.5)         // wave-shaping
```

### Pan & Stereo
```js
.pan(0.3)           // 0=left, 0.5=center, 1=right
```

### Modulation Effects
```js
.phaser(2)          // phaser speed
.tremolo(4)         // tremolo rate
```

### Compressor
```js
.compressor(-20, 4, 10, 0.01, 0.1)  // threshold, ratio, knee, attack, release
```

### Orbits
Orbits organize patterns into output contexts sharing delay and reverb:
```js
note("c3").orbit(0)
note("e3").orbit(1)
```

### Important Limitation
Effects are single-use per pattern — multiple occurrences override, don't stack.

---

## Signals (Continuous Modulation)

Signals are patterns with continuous values (infinite resolution).

### Oscillator Signals (0-1 range)
```js
saw, sine, cosine, tri, square
```

### Bipolar Signals (-1 to 1)
```js
saw2, sine2, cosine2, tri2, square2
```

### Random Signals
```js
rand          // continuous random 0-1
rand2         // continuous random -1 to 1
irand(n)      // random integer 0 to n-1
brand         // binary random (0 or 1)
brandBy(0.3)  // binary with probability
perlin        // Perlin noise 0-1
```

### Mouse Input
```js
mouseX        // horizontal position 0-1
mouseY        // vertical position 0-1
```

### Signal Methods
```js
sine.range(200, 2000)   // scale to range
sine.slow(4)            // slow modulation
sine.segment(8)         // discretize to 8 steps
```

### Usage Example
```js
note("c3 e3 g3 b3").lpf(sine.range(200, 4000).slow(4))
```

---

## Time Modifiers

| Function | Mini | Description |
|----------|------|-------------|
| `slow(n)` | `/n` | Slow down by factor n |
| `fast(n)` | `*n` | Speed up by factor n |
| `early(n)` | — | Shift pattern earlier |
| `late(n)` | — | Shift pattern later |
| `rev()` | — | Reverse pattern |
| `palindrome()` | — | Forward then backward each cycle |
| `iter(n)` | — | Rotate subdivisions each cycle |
| `iterBack(n)` | — | Rotate in reverse |
| `ply(n)` | — | Repeat each event n times |
| `euclid(p,s)` | `(p,s)` | Euclidean rhythm |
| `euclidRot(p,s,r)` | `(p,s,r)` | Euclidean with rotation |
| `segment(n)` | — | Sample pattern at n events/cycle |
| `compress(s,e)` | — | Compress into timespan |
| `zoom(s,e)` | — | Extract and play portion |
| `linger(f)` | — | Repeat pattern fraction |
| `fastGap(n)` | — | Speed up with gap |
| `clip(n)` / `legato(n)` | — | Multiply duration |
| `cpm(n)` | — | Set cycles per minute |
| `ribbon(off,len)` | — | Loop a section |
| `swingBy(sub,off)` | — | Add shuffle/swing |
| `swing(n)` | — | Shorthand for swingBy(1/3, n) |
| `inside(n,fn)` | — | Apply operation within cycle |
| `outside(n,fn)` | — | Apply operation across cycles |

---

## Pattern Effects (Manipulation)

### rev
```js
note("c d e f").rev()  // plays f e d c
```

### jux
Stereo split: original left, modified right:
```js
note("c e g b").jux(rev)
```

### add
Add values to pattern:
```js
note("c3 e3").add(7)           // transpose up 7 semitones
note("0 2 4").add("<0 1 2>")   // shifting pattern
```

### ply
Multiply density:
```js
sound("bd sd").ply(2)  // each hit plays twice
```

### off
Time-shifted modified copy:
```js
note("c3 e3 g3").off(1/8, x => x.add(12))  // octave canon
```

---

## Accumulation (Layering)

### superimpose
Add modified copies on top of original:
```js
note("c3 e3 g3").superimpose(x => x.add(12))
```

### layer
Stack transformed versions (no original):
```js
note("c3 e3").layer(x => x.add(7), x => x.add(12))
```

### off
Superimpose with time delay:
```js
note("c3 e3 g3").off(1/8, x => x.add(7))
```

### echo
Repeated offsets with decreasing velocity:
```js
note("c3").echo(4, 1/8, 0.5)  // 4 echoes, 1/8 apart, 50% velocity decay
```

### echoWith
Echo with custom function per iteration:
```js
note("c3").echoWith(4, 1/8, (pat, i) => pat.add(i * 3))
```

---

## Random Modifiers

### Selection
```js
choose("bd", "sd", "hh")              // random per event
wchoose(["bd", 0.6], ["sd", 0.4])    // weighted random
chooseCycles("bd", "sd", "hh")        // random per cycle (alias: randcat)
```

### Degradation
```js
.degradeBy(0.3)    // remove 30% of events randomly
.degrade()         // remove 50%
.undegradeBy(0.3)  // inverse removal logic
```

### Conditional Application
```js
.sometimesBy(0.3, x => x.add(12))  // apply 30% of the time
.sometimes(x => x.rev())            // 50%
.often(x => x.fast(2))              // 75%
.rarely(x => x.add(7))              // 25%
.almostNever(fn)                     // 10%
.almostAlways(fn)                    // 90%
.someCycles(fn)                      // 50% per cycle
```

---

## Conditional Modifiers

### Cycle-Based
```js
.firstOf(4, x => x.rev())     // apply every 4th cycle (first)
.lastOf(4, x => x.fast(2))    // apply every 4th cycle (last)
.when("1 0 1 0", x => x.rev()) // apply based on binary pattern
```

### Chunking
```js
.chunk(4, x => x.rev())      // divide into 4 parts, cycle through
.chunkBack(4, x => x.rev())  // same but reverse order
```

### Structure & Masking
```js
.struct("x ~ x ~ x ~ x ~")   // impose rhythmic structure
.mask("1 0 1 1")              // silence where 0
```

### Reset & Restart
```js
.reset("x ~ ~ ~")     // reset to cycle start on each x
.restart("x ~ ~ ~")   // restart from cycle 0 on each x
```

### Selection (pick)
```js
.pick("0 1 2 1", [patA, patB, patC])      // select by index
.pickmod("0 1 2 3 4", [patA, patB])       // wraps around
```

### Arpeggiation
```js
note("[c3,e3,g3]").arp("0 1 2 1")         // arpeggiate chord
```

### Other
```js
.invert()    // swap 1s and 0s in binary pattern
.hush()      // silence the pattern
```

---

## Stepwise Functions

Work with "steps" (top-level mini-notation elements):

```js
.pace(n)           // adjust speed to fit n steps/cycle
.stepcat(...)      // concatenate patterns proportionally
.expand(n)         // increase step size
.contract(n)       // decrease step size
.take(n)           // extract n steps from start (negative = end)
.drop(n)           // remove n steps from start
.polymeter()       // align by step repetition (alias: pm)
.shrink()          // progressively remove steps
.grow()            // progressively add steps
.zip()             // combine steps into single dense cycle
```

---

## Tonal Functions

```js
.scale("C:major")            // interpret numbers as scale degrees
.transpose(n)                // shift by semitones
.scaleTranspose(n)           // shift by scale steps
.voicing()                   // auto voice-lead chords
.rootNotes(octave)           // extract bass notes from chords
chord("<C Am F G>")          // chord progression
```

---

## Tempo & Timing

```js
setcps(0.5)       // cycles per second (default)
setcpm(120)       // cycles per minute
setcpm(120/4)     // if you want 120 BPM with 4 beats per cycle
```

- Default: 0.5 CPS = 1 cycle every 2 seconds
- Cycles compress all content proportionally
- No bars/measures concept — only cycles

---

## Visual Feedback

```js
.pianoroll()      // pianoroll visualization
.punchcard()      // punchcard view (less CPU)
.spiral()         // rotational visualization
.scope()          // oscilloscope
.pitchwheel()     // circular pitch diagram
.spectrum()       // spectrum analyzer
```

Prefix with `_` for inline display (e.g., `._pianoroll()`).

---

## Input Devices

### Gamepad
```js
const gp = gamepad(0)
s("bd").mask(gp.tglA)
note("c3").lpf(gp.x1.range(100, 4000))
```

---

## Playing Multiple Patterns

Use `$:` prefix to play multiple patterns simultaneously:
```js
$: sound("bd sd bd sd")
$: note("c3 e3 g3 b3").sound("piano")
```

Use `_$:` to mute a pattern.

---

## Complete Examples

### Basic Beat
```js
sound("bd sd [~ bd] sd")
  .bank("RolandTR808")
```

### Melodic Pattern with Effects
```js
note("c3 [eb3 g3] bb2 [f3 ab3]")
  .sound("sawtooth")
  .lpf(sine.range(400, 3000).slow(8))
  .room(0.3)
  .delay(0.25)
```

### Layered Composition
```js
$: note("<C^7 Am7 F^7 G7>").voicing().sound("piano").room(0.4)
$: note("<C Am F G>").rootNotes(2).sound("sawtooth").lpf(400)
$: sound("bd ~ [bd ~] ~, ~ sd ~ sd, hh*8").bank("RolandTR909")
```

### Euclidean Rhythm
```js
sound("bd(3,8), sd(2,8,1), hh(5,8)")
  .bank("RolandTR808")
```

### FM Synthesis Pad
```js
note("<[C3,E3,G3,B3] [A2,C3,E3,G3]>/2")
  .sound("sine")
  .fmh(2)
  .fmdecay(0.3)
  .attack(0.5)
  .release(1)
  .room(0.7)
```

### Pattern Manipulation
```js
note("c3 e3 g3 b3")
  .sound("piano")
  .off(1/8, x => x.add(12).velocity(0.4))
  .jux(rev)
  .slow(2)
```

---

## Key Concepts Summary

1. **Everything is a pattern** — notes, effects, timing are all patterns
2. **Cycles are the time unit** — not bars or beats
3. **Mini-notation** — compact syntax inside strings
4. **Method chaining** — build complexity with `.function()` chains
5. **Patterns are composable** — combine, layer, transform freely
6. **Signals modulate** — continuous values for parameter automation
7. **Live coding** — edit and hear changes instantly
