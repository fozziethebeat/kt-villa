# Target style profile (music evaluator rubric)

Built by gemini-4-hydrogen from the reference videos on 2026-11-21. **Edit this file to change what the evaluator checks**;
rebuild from scratch with `npm run music:profile` (that overwrites your edits).

## References
- Hitsujibungaku – "more than words" (130 BPM, 4/4, D minor (D Aeolian) with frequent shifts toward its relative major (F major), centered around bVI - bVII - i and IV - V - vi harmonic movement) https://www.youtube.com/watch?v=kGY6N9DL4Jw
- tiny yawn – "花筏 (Hanaikada)" (100 BPM, 4/4, A Major (diatonic Ionian with heavy reliance on IVmaj7 and vi7 modal colors)) https://www.youtube.com/watch?v=hH7VWQRbyxo
- Gestalt Girl (ゲシュタルト乙女) – "再見" (80 BPM, 4/4, D major (Ionian)) https://www.youtube.com/watch?v=x17_yDVIe3g

## Genre summary
A modern Japanese indie-rock and bittersweet guitar-pop style blending crisp single-coil clean arpeggios, warm acoustic strumming, and mid-forward tube overdrive or controlled fuzz swells over an agile, dry acoustic rhythm section. Across tempos from 80 to 130 BPM in accessible 4/4, the sound balances intimate, nostalgic restraint in quiet passages with wide, emotionally resonant full-band lifts rich in maj7, add9, and sus2 chord colors—fitting naturally into a cozy Hakuba mountain van-cafe setting without slipping into sterile lo-fi or synthetic game music.

## Target sound
- Bright single-coil clean electric guitars (Telecaster, Stratocaster, or Jazzmaster style) playing crisp arpeggios, dyads, and staccato rhythmic motifs alongside optional steel-string acoustic strumming.
- Mid-forward tube overdrive (and selective, controlled shoegaze fuzz in high-energy peaks) that preserves 7th and 9th chord legibility without scooped metal chugs.
- Tight, dry studio acoustic drums featuring a punchy damped snare, focused kick, articulated 8th/16th-note hi-hat pockets with ghost notes, and wide crash-ride washes in lifts.
- Warm, woody P-Bass or Jazz Bass fingerstyle/pick lines that lock with the kick drum while weaving octave leaps, diatonic walk-ups, and syncopated anticipations.
- Bittersweet diatonic Japanese indie harmony built around Royal Road (IVmaj7 - V - iii7 - vi7) and relative minor/major shifts (bVI - bVII - i) with ringing open upper extensions.
- Lyrical, vocal-like lead guitar melodies (or delicate Rhodes/bell-chime doublings) replacing the lead vocal with clear motif-based phrasing and octave hooks.
- Noticeable dry-to-wet and narrow-to-wide production contrast rather than brickwalled loudness or uniformly washed-out reverb.

## Criteria
### Guitar Tone & Dual-Layer Parts (`guitar_tone_and_parts`, weight 18)
**Good:** Clear textural dialogue between two or more complementary guitar voices: a bright single-coil clean guitar (Twin/JC-style clarity with light compression and subtle chorus or short plate reverb) executing twinkly open-string arpeggios, palm-muted 8th-note pulses, or crisp chord stabs, paired with either a bronze-bright steel-string acoustic bed or wide-panned, mid-forward tube-overdriven rhythm guitars letting maj7 and add9 voicings bloom across bar lines.

**Failure modes:**
- High-gain scooped metalcore or djent distortion with heavy palm-muted chugs that obliterate chord extensions.
- Thin, fizzy direct-in amp-sim buzz lacking warm tube midrange body.
- One static guitar timbre doing the same strumming pattern from start to finish with no clean-versus-driven textural contrast.
- Overly wet shoegaze fuzz masking rhythmic articulation in quiet or groove-driven sections.

**How to listen:** Focus on the pick attack and upper-string ring in quiet sections, then check whether chorus or lift layers widen into warm, woody midrange saturation where individual 7th and 9th notes remain audible rather than collapsing into white noise.

### Acoustic Drums & Pocket Groove (`drums_and_groove`, weight 15)
**Good:** An organic, slightly damped Japanese studio drum kit in 4/4 (80 to 130 BPM) with a tight, punchy kick (60-80 Hz), dry crisp snare with subtle ghost-note sensitivity, and nimble closed 8th- or 16th-note hi-hat grooves in verses that open naturally onto crash-ride washes and musical tom fills in lifts. Whether riding a buoyant 130 BPM four-on-the-floor pulse or an unhurried 80-100 BPM indie pocket, the kit breathes like a live drummer.

**Failure modes:**
- Robotic, over-quantized MIDI drum velocity where every hi-hat and snare hit sounds identical.
- Electronic 808 sub-kicks, skittering trap hi-hat rolls, or EDM four-on-the-floor club thump.
- Huge 1980s gated snare reverb or booming room mics that blur 16th-note ghost strokes and syncopations.
- Heavy swung boom-bap or sluggish halftime drag that strips away forward momentum.

**How to listen:** Solo your attention on the hi-hat and snare during transitions: listen for micro-dynamic ghost notes, natural stick bounce, and the audible shift from tight closed-hat intimacy to open cymbal bloom.

### Bass Tone & Melodic Glue (`bass_foundation`, weight 12)
**Good:** A round, woody Precision or Jazz Bass tone with warm low-mids and controlled sub weight that anchors the kick drum cleanly. In sparse passages it leaves deliberate rhythmic air or holds warm roots; in grooves and lifts it drives forward with steady 8th-note motion, octave pops, off-beat anticipations (pushing the 'and' of beat 4), and smooth diatonic scalar walk-ups between IV, V, and vi.

**Failure modes:**
- Synthetic sub-bass pads or EDM sawtooth bass replacing electric bass.
- Static whole-note root droning with zero passing tones, octave movement, or rhythmic pocket.
- Excessive metallic clank or bloated 40-60 Hz sub-boom colliding with the kick drum.
- Muddy low-mid buildup (120-250 Hz) burying guitar clarity.

**How to listen:** Track the relationship between the kick drum and the bass notes at chord turnarounds—listen for crisp rests, tasteful octave leaps, and scalar step-ups leading into bar 1.

### Harmony & Bittersweet Chord Colour (`harmony_and_chord_colour`, weight 13)
**Good:** Warm, nostalgic Japanese indie-rock progressions centered on Royal Road motion (IVmaj7 - V - iii7 - vi7), relative major/minor interplay, or Aeolian bVI - bVII - i cadences. Chords consistently retain ringing open strings and extensions (maj7, add9, sus2, m7, slash-chord bass walk-ups like V/iii) to create gentle, mountain-air wistfulness without losing tonal accessibility.

**Failure modes:**
- Generic campfire bare major/minor triads or sterile 1-5 power chords with zero upper extensions.
- Overly complex chromatic jazz reharmonization or jarring odd-meter math-rock shifts that break the cozy atmosphere.
- Dark, aggressive Phrygian or diminished metal harmony.
- Endless two-chord lo-fi loop stasis with no harmonic lift or turnaround resolution.

**How to listen:** Listen to the top ringing notes across chord changes—notice whether shared 9th, 7th, and suspended tones chime across bar lines and whether pre-chorus or lift sections create genuine emotional yearning.

### Instrumental Lead Melody & Hooks (`melody_and_lead_hooks`, weight 12)
**Good:** Because vocals are absent, a lead single-coil guitar (or subtle Rhodes/bell-chime unison) steps cleanly into the focal center-front role with singable, conversational phrasing. Verse-like motifs use syncopated pickups and stepwise pentatonic/diatonic movement, contrasting against soaring lift phrases that leap upward by a 5th, 6th, or octave onto the 9th or major 7th before resolving warmly—plus memorable 3-to-5-note arpeggio or octave hooks.

**Failure modes:**
- Aimless noodle-heavy guitar shredding, blues-rock pentatonic bends, or constant 16th-note soloing.
- No discernible central melody—leaving the track feeling like an empty karaoke backing track.
- Rigid, blocky synth-lead or chiptune square-wave melodies sounding like retro arcade music.
- Constant high-density melodic playing with zero breathing room or call-and-response phrasing.

**How to listen:** Try humming along after 30 seconds: verify that a clear, vocal-shaped instrumental melody leads the ear through distinct A and B sections with clear phrase endings and pauses.

### Arrangement Arc & Dynamic Sculpting (`arrangement_and_dynamics`, weight 10)
**Good:** Thoughtful terraced layering typical of Japanese indie rock—building and releasing tension through instrumentation changes rather than abrupt volume jumps. Clean guitar, acoustic strums, or solo drums establish intimacy before bass and overdrive widen the frame, followed by delicate clean-arpeggio or chime interludes that give the listener's ear space to breathe.

**Failure modes:**
- A flat, static 8-bar loop repeating unchanged for two minutes.
- All instruments blasting at 100 percent intensity from the very first downbeat.
- Abrupt EDM risers, white-noise sweeps, or jarring drop-cuts.
- Huge dramatic rock-opera endings or chaotic shoegaze noise climaxes that clash with cozy background play.

**How to listen:** Map the texture every 8 to 16 bars and confirm that instruments enter, drop out, and hand off rhythmic density smoothly to create clear chapter-like contrast.

### Mix Clarity, Wet/Dry Balance & Space (`mix_clarity_and_space`, weight 10)
**Good:** Controlled, natural studio realism with deliberate contrast between dry rhythm anchors (kick, snare, bass, verse arpeggios) and tasteful stereo plate or short hall reverb on lead lines and overheads. Crisp 2.5-10 kHz air highlights acoustic string sheen and single-coil pick articulation while a clean roll-off below 40 Hz keeps the low end tight and uncluttered.

**Failure modes:**
- Reverb or delay so heavy that drum transients and arpeggio picks smear into an indistinct ambient wash.
- Boxy 200-400 Hz low-mid mud obscuring guitar extensions and bass definition.
- Harsh 3-5 kHz digital guitar sizzle or piercing cymbal hiss causing ear fatigue.
- Brickwall limiting crushing snare punch and eliminating verse-to-chorus width expansion.

**How to listen:** Check transient snap on the snare and clean guitar plucks on low volume—if the center feels dry and grounded while stereo guitars bloom cleanly around it without masking, the space is right.

### Japanese Indie Authenticity & Hakuba Cafe Atmosphere (`genre_authenticity_and_vibe`, weight 10)
**Good:** Unmistakable live four-piece Japanese indie band chemistry—evoking the crisp wistfulness of Hitsujibungaku, tiny yawn, and Gestalt Girl while fitting seamlessly behind a cozy alpine van-cafe game in Hakuba. Subtle Rhodes or bell-chime accents warm the transitions without overtaking the organic guitar-bass-drum core, passing effortlessly on a curated Tokyo indie playlist.

**Failure modes:**
- Generic Western corporate acoustic-indie ukulele/claps stock music.
- Overtly synthetic lo-fi hip-hop with vinyl crackle, tape wobble, or jazz-chord Rhodes loops.
- Glossy anime-opening pop-rock brass, hyperpop glitches, or synthwave arpeggios.
- Melancholy so heavy, loud, or abrasive that it overwhelms cozy cafe gameplay.

**How to listen:** Ask blindly: if vocals were removed from a modern Japanese indie-rock playlist track, would this instrumental sit comfortably beside it while sounding inviting and scenic during calm mountain-valley gameplay?

## Red flags (cap the overall score)
- Cavernous ambient reverb or excessive delay washing out drum transients and clean guitar arpeggios.
- Toy-like chiptune, 8-bit square waves, bright synthwave arps, or overtly electronic EDM risers and sidechain pumping.
- Static, unchanging 4- or 8-bar loop with zero arrangement development or harmonic turnaround.
- 808 sub-bass, quantized trap hi-hat rolls, or heavy lo-fi hip-hop vinyl crackle and swung boom-bap beats.
- High-gain scooped metal distortion, djent chugs, or shred-heavy blues-rock guitar soloing.
- Brickwall-compressed loudness with zero dynamic breathing room between intimate clean passages and full-band lifts.

## Adapting the style for game music
- Design seamless loop points at 8- or 16-bar boundaries using sustaining add9/maj7 guitar tails or bell-chime decay so the track cycles smoothly without awkward fade-outs or abrupt downbeat cuts.
- Replace soaring lead vocals with a warm, mid-focused single-coil lead guitar (optionally doubled softly in octaves by Rhodes or celesta chimes), leaving generous 1-to-2-bar rests between phrases so gameplay sound effects and dialogue stay clear.
- Temper the sharpest rock dynamic extremes: retain the clean-to-overdriven guitar contrast and drum pocket shifts, but avoid deafening shoegaze wall-of-noise peaks or harsh cymbal crashes that fatigue players over 15-minute cafe sessions.
- Keep low-end sub frequencies clean and controlled so the music remains cozy and legible on handheld speakers as well as headphones.
- Structure sections as modular energy tiers (intimate acoustic/clean arpeggio morning vibe -> tight full-band verse groove -> warm overdriven midday lift -> delicate chime/guitar interlude) so the music rewards extended play without demanding full foreground attention.
