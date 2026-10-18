# Day 1 Higgsfield prompt pack and production plan

**Status:** DRAFT. No media has been generated yet.
**Why:** the Higgsfield connector in this production environment is read-only. It can list models, show the credit balance (100 credits, Plus plan when checked), and browse past generations, but it cannot generate media. Run these prompts in the Higgsfield web app, then drop the exported files into `public/videos/day-01/` using the file names below.

> **Accuracy rule:** AI video often produces impossible joint motion, sliding feet, morphing chairs, or extra limbs. Treat every generated exercise clip as **unverified** until someone has watched it frame by frame and approved it (see the QC checklist at the end). If a clip can't pass after about 3 attempts, flag it for a **live-action reshoot**. Don't ship a misleading demonstration.

---

## 0. Global settings

| Setting | Value |
|---|---|
| Recommended video model | **Seedance 2.0** (`seedance_2_0`): supports start/end frames and image references, and keeps identity consistent. Use mode `std`, 1080p, bitrate `high`. |
| Alternative | Kling 3.0 (already used in your history) or MiniMax H3 (`minimax_h3`) with start and end keyframes |
| Reference stills model | **Higgsfield Soul 2.0** (`soul_2`) for the instructor; **Nano Banana Pro** (`nano_banana_pro`) for edits and set consistency |
| Aspect ratio | 16:9 (crop to 9:16 later if the app needs vertical) |
| Audio | `generate_audio: false`. Voiceover and music are added in the edit. |
| Genre | `auto` (avoid dramatic genres) |
| Durations | 5–10 s per shot (single reps run 6–8 s) |

### Global style block (paste at the end of every video prompt)

```
Photorealistic, natural daylight from a large window, soft shadows, bright modern living room with warm off-white walls, light oak floor, a few green plants, uncluttered. Calm premium wellness aesthetic, muted sage-green and warm neutral palette. Realistic human anatomy and proportions, natural joint movement, both feet and hands always visible, full body in frame. Locked-off tripod camera, no camera shake, no zoom, no cuts. Smooth, slow, controlled movement at real-time speed.
```

### Global negative prompt (where the model supports it)

```
extra limbs, extra fingers, distorted joints, knee bending backward, hyperextension, warped chair, chair legs morphing, wheeled office chair, rolling chair, floating feet, sliding feet, foot passing through floor, body morphing, face changing, clothing changing color, camera shake, fast motion, jerky motion, slow-motion effect, gym equipment, weights, dramatic lighting, text, watermark, logo, cropped feet, cropped head
```

### Instructor description (use the exact same wording every time)

```
a friendly, healthy-looking woman around 60 years old, silver-grey shoulder-length hair tied back loosely, warm natural smile, average build, wearing a soft sage-green long-sleeve fitted top, charcoal straight-leg stretch pants, and white low-profile supportive sneakers
```

*(Feel free to swap in a male or different instructor. Just keep the same wording across every shot.)*

---

## 1. Reference stills (generate these first)

Generate these images first, pick the best one of each, and reuse them as `start_image`, `end_image`, and image references for every video shot. Doing this is the main way to keep the instructor, wardrobe, chair, and room consistent.

| ID | Model | Aspect | Prompt |
|---|---|---|---|
| **REF-01 instructor** | Soul 2.0 | 3:4 | `Full-body portrait of [INSTRUCTOR], standing relaxed, facing camera at a slight angle, in [ROOM]. Natural window light, photorealistic, realistic proportions.` |
| **REF-02 room + chair** | Soul Location or Nano Banana Pro | 16:9 | `Bright modern living room, warm off-white walls, light oak floor, large window with soft daylight, a sturdy solid-oak dining chair with four legs, no wheels, with armrests, placed with its back against a plain wall, a few green plants, uncluttered, photorealistic.` |
| **REF-03 counter** | Nano Banana Pro (REF-02 as reference) | 16:9 | `Same room, open-plan kitchen side: a solid light-stone kitchen counter at hip height with fixed base cabinets, clear floor space in front, same light and palette.` |
| **KF-SEAT** | Nano Banana Pro (REF-01 + REF-02) | 16:9 | `[INSTRUCTOR] sitting upright toward the front of the sturdy oak chair against the wall, both feet flat on the floor hip-width apart, knees bent about 90 degrees, hands resting lightly on the front edge of the seat. Three-quarter front view from the instructor's right side, camera at hip height, full body and all four chair legs visible.` |
| **KF-KNEE-R-TOP** | Nano Banana Pro (KF-SEAT) | 16:9 | `Same frame. Instructor's right knee straightened to nearly straight, right foot lifted with heel off the floor and toes pointing up, thigh still resting on the seat, upper body upright, left foot flat.` |
| **KF-KNEE-L-TOP** | Nano Banana Pro (KF-SEAT) | 16:9 | Same as above, but with the **left** leg. |
| **KF-COUNTER** | Nano Banana Pro (REF-01 + REF-03) | 16:9 | `[INSTRUCTOR] standing upright facing the kitchen counter, both hands resting on the countertop, feet hip-width apart, knees soft. Side three-quarter view from behind-right at hip height, full body visible including both feet and both hands.` |
| **KF-HIP-R-BACK** | Nano Banana Pro (KF-COUNTER) | 16:9 | `Same frame. Right leg moved a short distance straight backward, about 15 degrees at the hip, right knee nearly straight, toes lightly off the floor, trunk upright, no arching of the lower back, both hands on counter.` |
| **KF-HIP-L-BACK** | Nano Banana Pro (KF-COUNTER) | 16:9 | Same as above, but with the **left** leg. Use the view from behind-left, or mirror. |
| **KF-STS-SIT** | Nano Banana Pro (REF-01 + REF-02) | 16:9 | `[INSTRUCTOR] sitting near the front of the sturdy oak armchair against the wall, feet flat hip-width apart and slightly behind the knees, hands on the armrests, upright. Three-quarter front view from the right, camera at hip height, full body and chair visible.` |
| **KF-STS-STAND** | Nano Banana Pro (KF-STS-SIT) | 16:9 | `Same frame. Instructor now standing fully upright in front of the chair, feet in the same position, arms relaxed at sides, chair unchanged against the wall.` |

**Check before moving on:** the chair has four legs and no wheels, the hands have five fingers, and the wardrobe, hair, and face are identical in every keyframe.

---

## 2. Video shots

`[INSTRUCTOR]` means the instructor description above. `[STYLE]` means the global style block.
**Loop technique:** single-rep shots use the **same image for start and end frame**, so each rep ends exactly where it began and can be looped seamlessly 5 times in the edit. **Never cut in the middle of a rep.**

### Scene 1: Introduction → `day01-introduction.mp4` (40 s, plus Scene 2 graphics if they're cut in)

| Shot | Dur | Start / End | Prompt |
|---|---|---|---|
| **S1-A** | 10 s | start: REF-01 composited in room | `Wide shot. [INSTRUCTOR] stands beside a sturdy oak chair in the living room, looks toward the camera and gives a warm, relaxed smile, small natural weight shift, hands relaxed. She does not speak. [STYLE]` |
| **S1-B** | 10 s | start: last frame of S1-A | `Very slow gentle push-in from wide to medium-full shot. [INSTRUCTOR] gives a small friendly nod and an open-palm welcoming gesture, calm and reassuring. Mouth closed or soft smile, not talking. [STYLE]` |
| **S1-C** | 10 s | start: REF-02 | `Slow lateral pan across the bright room, from the sturdy oak chair against the wall to the solid kitchen counter. No person. Calm, inviting. [STYLE]` |

### Scene 2: Education (65 s)

**Recommendation:** build these as **motion graphics** (After Effects, Rive, Remotion, or Keynote export), not AI video. Line diagrams need to be exactly right and AI tends to warp anatomy. If you want an AI-assisted base, generate stills with Nano Banana Pro and animate them in the edit.

| Shot | Dur | Still prompt (Nano Banana Pro, 16:9) |
|---|---|---|
| **S2-A** | 15 s | `Minimal flat vector illustration, side view of a simplified human leg drawn as clean sage-green line art on a warm off-white background, showing the knee bending like a hinge. Three positions of the lower leg shown faintly. No text, no muscles, no bones, calm medical-education style.` |
| **S2-B** | 17 s | `Same minimal style, standing side-view leg line art with three circular joint markers at hip, knee, and ankle connected by a single line. No text.` |
| **S2-C** | 18 s | `Same minimal style, standing leg outline with soft translucent sage-green highlighted regions over the side of the hip, front of the thigh, and back of the thigh. No text, no anatomical detail.` |
| **S2-D** | 15 s | `Three simple flat line icons in a row in the same palette: a dining chair, a kitchen counter, and a person rising from a chair. No text.` |

Add the labels (`Hip`, `Knee`, `Ankle`, and so on) as live text in the edit, not in the generated image.

### Scene 3: Seated Knee Extension → `day01-knee-extension.mp4` (125 s)

| Shot | Dur | Start / End | Prompt |
|---|---|---|---|
| **S3-A** | 10 s | end: KF-SEAT | `Wide three-quarter view. [INSTRUCTOR] walks calmly to the sturdy oak chair placed against the wall, turns, and sits down slowly toward the front of the seat, ending upright with both feet flat and hands resting on the seat edge. The chair does not move. [STYLE]` |
| **S3-B** | 8 s (hold or extend) | start = end: KF-SEAT | `[INSTRUCTOR] sits still and upright on the chair, breathing calmly, both feet flat on the floor, hands on the seat edge, small natural blink. Almost no movement. [STYLE]` |
| **S3-C** | 6 s (one rep, loop ×5) | start: KF-SEAT, end: KF-SEAT, mid-reference: KF-KNEE-R-TOP | `[INSTRUCTOR] sits upright. Over two seconds she slowly straightens her RIGHT knee, lifting the right foot forward until the leg is nearly straight, with the thigh staying on the seat. She holds for one second, then over three seconds slowly lowers the right foot back to the floor to the exact starting position. The left foot stays flat and still. Upper body stays upright and still. One single repetition only. [STYLE]` |
| **S3-D** | 6 s | start = end: KF-SEAT | Same as S3-B, with a slight relaxed exhale. |
| **S3-E** | 6 s (one rep, loop ×5) | start: KF-SEAT, end: KF-SEAT, mid-reference: KF-KNEE-L-TOP | Same as S3-C with **LEFT** and right swapped. |

### Scene 4: Supported Standing Hip Extension → `day01-hip-extension.mp4` (120 s)

| Shot | Dur | Start / End | Prompt |
|---|---|---|---|
| **S4-A** | 8 s | end: KF-COUNTER | `[INSTRUCTOR] walks to the solid kitchen counter and places both hands on the countertop, settling into an upright stance with feet hip-width apart. Side three-quarter view, full body. [STYLE]` |
| **S4-B** | 8 s | start = end: KF-COUNTER | `[INSTRUCTOR] stands still and upright at the counter, both hands resting on it, calm breathing, minimal movement. [STYLE]` |
| **S4-C** | 6 s (one rep, loop ×5) | start: KF-COUNTER, end: KF-COUNTER, mid-reference: KF-HIP-R-BACK | `[INSTRUCTOR] stands upright holding the counter with both hands. Over two seconds she slowly moves her RIGHT leg straight backward a short distance, keeping the knee nearly straight and the toes lightly off the floor, trunk staying upright with no forward lean and no lower-back arch. She holds for one second, then over three seconds returns the right foot beside the left to the exact starting position. Hands stay on counter. The standing leg stays still. One single repetition only. [STYLE]` |
| **S4-D** | 6 s | start = end: KF-COUNTER | Same as S4-B. |
| **S4-E** | 6 s (one rep, loop ×5) | start: KF-COUNTER, end: KF-COUNTER, mid-reference: KF-HIP-L-BACK | Same as S4-C with **LEFT** and right swapped. |

### Scene 5: Supported Sit-to-Stand → `day01-sit-to-stand.mp4` (100 s)

| Shot | Dur | Start / End | Prompt |
|---|---|---|---|
| **S5-A** | 8 s (hold or extend) | start = end: KF-STS-SIT | `[INSTRUCTOR] sits near the front of the sturdy oak armchair against the wall, feet flat and slightly behind the knees, hands on the armrests, calm and still. The chair does not move. [STYLE]` |
| **S5-B / S5-C** | 8 s (one rep; used once slowly for S5-B and looped ×5 for S5-C) | start: KF-STS-SIT, end: KF-STS-SIT, mid-reference: KF-STS-STAND | `[INSTRUCTOR] sits near the front of the chair, hands on the armrests. Over three seconds she leans her chest slightly forward, presses through both feet and the armrests, and rises smoothly to standing fully upright. She pauses one second standing tall. Over four seconds she reaches back to the armrests and lowers herself slowly and with control back onto the seat to the exact starting position. Feet do not slide. The chair stays fixed against the wall. One single repetition only. [STYLE]` |
| **S5-D** | 6 s | start = end: KF-STS-SIT | `[INSTRUCTOR] sits relaxed on the chair, hands on thighs, gives a warm reassuring smile toward camera. Not speaking. [STYLE]` |

### Scene 6: Closing → `day01-closing.mp4` (28 s)

| Shot | Dur | Start / End | Prompt |
|---|---|---|---|
| **S6-A** | 10 s | start: REF-01 in room | `Medium-full shot. [INSTRUCTOR] stands relaxed beside the oak chair, smiles warmly at the camera and gives a small friendly wave. Not speaking. [STYLE]` |
| **S6-B** | 12 s | — | End card built as a graphic in the edit (not generated): `Day 1 complete` + `Complete today's check-in` in the Mobility palette. |

---

## 3. Assembly recipe

1. Record or produce the voiceover from `day01-script.md` and lock its timings.
2. For each exercise scene, place the one-rep clip on the timeline once per rep, aligned so each rep starts on its spoken count (6 s per rep for the knee and hip shots, 8 s for sit-to-stand). Use straight cuts at the loop point. If the start and end frames match, no jump should be visible.
3. If you need to slow a rep, use frame blending at no less than 85% speed. Never use slow-motion effects.
4. Add the lower-third title and dose, the `DRAFT` tag (remove it after approval), the rep counter, and the small safety text.
5. Re-time `day01-captions.vtt` to the final voiceover. Export each scene at H.264 1080p, AAC 128 kbps, with `+faststart`:
   ```
   ffmpeg -i scene.mov -c:v libx264 -crf 20 -preset slow -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart day01-knee-extension.mp4
   ```
6. (Optional) Concatenate all the scenes into `day01-complete.mp4`.
7. Update `day01-manifest.json`: set `mediaGenerationStatus` to `generated`, fill in `actualDurationSec` (from `ffprobe`), and record the Higgsfield generation IDs. Leave the approvals as `unapproved` until reviewers sign off.

---

## 4. Movement-quality QC checklist (per clip, frame by frame)

Mark each clip **pass**, **regenerate**, or **reshoot live**:

- [ ] Full body visible the whole time, including feet, hips, knees, hands, and chair or counter
- [ ] Joints bend only in anatomically possible directions; no knee hyperextension or snapping
- [ ] Knee extension: thigh stays on the seat, upper body upright, the opposite foot stays flat
- [ ] Hip extension: small range, trunk upright, no lower-back arch, both hands stay on the counter
- [ ] Sit-to-stand: forward lean before rising, controlled descent, no dropping into the seat
- [ ] Feet don't slide or float; no contact with the floor is lost unintentionally
- [ ] Chair and counter stay rigid, fixed in place, with no wheels and no morphing
- [ ] Exactly one rep per loop clip, and the start and end frames match
- [ ] Same instructor face, hair, and wardrobe as the other shots
- [ ] Rep timing matches the spoken count in the edit
- [ ] No text, logos, or watermarks
- [ ] Hands have five fingers; no extra limbs

**Reshoot trigger:** if a clip fails any anatomy, stability, or range item after 3 regenerations, film that exercise live with a real instructor, using the same framing and wardrobe as described here.

---

## 5. Pilot test (generated 2026-10-18 via Higgsfield CLI, 9.5 credits)

**Reference image:** `nano_banana_pro`, 16:9, 2k, 2 credits, job `99768b5a-3f7b-484f-af71-aa17abd6cc2e` saved as `day01-instructor-reference.jpg`.

```
Photorealistic full-body photograph of a friendly, healthy-looking woman about 62 years old, silver-grey shoulder-length hair loosely tied back, warm natural relaxed expression, average build, realistic natural skin texture, wearing a soft sage-green long-sleeve fitted top, charcoal straight-leg stretch pants, and white low-profile supportive sneakers. She sits upright toward the front of a sturdy solid light-oak dining chair with four straight wooden legs and no wheels, armless, the chair back placed against a plain warm off-white wall. Both feet flat on a light oak floor, hip-width apart, knees bent at about 90 degrees directly above the ankles, hands resting lightly on the front edge of the seat beside her thighs, shoulders relaxed. Three-quarter front view from her right side, camera at hip height, the entire body from head to shoes plus all four chair legs fully visible with generous space around her. Bright minimalist premium wellness living room, large window with soft natural daylight from the left, one green plant in the background, uncluttered, calm sage and warm neutral palette, soft shadows, sharp focus, realistic human anatomy and proportions, five fingers on each hand. No text, no logo, no watermark.
```

**Test clip:** `kling3_0`, mode std, 5 s, sound off, start and end frame set to the reference image, 7.5 credits, job `3273f4d4-aceb-4dbc-a078-592837d5713a`, saved as `day01-test-knee-extension-left-rep.mp4`.

```
Locked-off stationary tripod camera, no camera movement, no zoom, no cuts. The same woman sits upright on the sturdy wooden chair in the bright minimalist room. She performs exactly one slow, controlled seated knee extension with her LEFT leg (the leg nearest the camera): over about two seconds she slowly straightens the knee, lifting the foot forward and up until the leg is nearly straight, thigh staying in contact with the seat, toes pointing up. She holds briefly, then over about two seconds slowly lowers the foot back down until the shoe rests flat on the floor in exactly its starting position. The other foot stays flat and completely still. Upper body stays upright and still, hands stay resting on the seat edge. The chair does not move. Natural, anatomically realistic knee motion, real-time speed, calm expression. Realistic human proportions, full body including both feet visible the entire time. No text, no narration.
```

CLI command pattern:

```
higgsfield generate create kling3_0 --prompt "<prompt>" --start-image <ref_job_id> --end-image <ref_job_id> --duration 5 --mode std --sound off --aspect_ratio 16:9 --wait
```

Review notes are in `day01-manifest.json` under `testAssets`.

## 6. Corrected pilot (v2, 9.5 credits)

**Reference v2:** `nano_banana_pro` edit of job `99768b5a-…` (passed as `--image-references`), 2 credits, job `65f74ef2-1c68-48ea-ba5b-dad0a682b789`, saved as `day01-instructor-reference-v2.jpg`.

```
Edit this photo. Keep the exact same woman (same face, silver-grey hair tied back, age about 62, same expression), the same clothing (sage-green long-sleeve top, charcoal straight-leg pants, white sneakers), the same light-oak four-legged armless wooden chair with no wheels, the same seated posture with both feet flat and hands resting on the front edge of the seat, the same side-on camera angle, camera height, lens, framing, floor, windows, plant, natural daylight and calm minimalist palette.
Change only the chair placement: add a plain warm off-white wall on the right side of the room, running from the back wall toward the camera, and place the chair so its backrest rests flush and securely against that wall, with all four chair legs on the floor. The woman stays seated on the chair in the same pose. The entire body from head to shoes, both feet, and all four chair legs remain fully visible with space around them. Photorealistic, realistic anatomy and proportions, five fingers on each visible hand. No text, no logo, no watermark.
```

**Test clip v2:** `kling3_0` std, 5 s, sound off, start/end frame = reference v2, 7.5 credits, job `99922234-4fb5-4606-8154-eec5b77338b4`, saved as `day01-test-knee-extension-left-rep-v2.mp4`.

```
Locked-off stationary tripod camera, no camera movement, no zoom, no cuts. The same woman sits upright on the sturdy wooden chair whose backrest rests against the wall. She performs exactly one slow, smooth, controlled seated knee extension with her LEFT leg (the leg nearest the camera). Starting from rest, over about two seconds she gradually straightens the knee, raising the lower leg forward until the leg is close to straight but relaxed, within a comfortable range, never locked or forced. As the leg rises she gently pulls her toes up toward her shin, so the foot is flexed with the toes pointing upward and the sole of the shoe facing forward. Her thigh stays resting on the chair seat the whole time; only the lower leg moves, hinging at the knee. She holds the top position for about one second, then over about two seconds slowly lowers the foot back down until the shoe rests flat on the floor in exactly its starting spot. The right foot stays flat and completely still. Her torso stays upright and still, shoulders relaxed, hands resting on the seat edge, calm expression. The chair stays completely stationary against the wall. Natural, anatomically realistic knee and ankle motion at real-time speed, consistent body proportions, both feet and the whole body visible at all times. No text, no narration.
```
