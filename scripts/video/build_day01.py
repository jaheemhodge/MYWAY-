"""Builds day01-captions.vtt and day01-manifest.json from one narration timeline,
so captions, script timings and manifest never drift apart."""
# Usage: python3 scripts/video/build_day01.py public/videos/day-01
import json, os, re, sys

OUT = sys.argv[1]

# (scene_id, start_s, end_s, text). Count cues sit at the start of each repetition.
SEGMENTS = []

def seg(scene, start, end, text):
    SEGMENTS.append((scene, start, end, text))

def counts(scene, start, per_rep, n=5):
    words = ["One.", "Two.", "Three.", "Four.", "Five."]
    for i in range(n):
        t = start + i * per_rep
        seg(scene, t, t + 2.0, words[i])

# Scene 1: Introduction 0:00-0:40
seg("intro", 2, 38,
    "Welcome to Day 1. When everyday movements start feeling harder on your knees, it's worth "
    "looking beyond the knee itself. Your hips and leg muscles also play an important role in how "
    "you stand, walk, and move. Today, we'll introduce three gentle strengthening movements to help "
    "you begin building that support. Go at your own pace, and feel free to pause at any time.")

# Scene 2: Education 0:40-1:45
seg("education", 42, 103,
    "Your knee works mostly like a hinge. It bends and straightens as you sit down, stand up, walk, "
    "and climb stairs. But it doesn't work on its own. Above it is your hip, and below it is your "
    "ankle. How these joints move, and how well the surrounding muscles support them, can influence "
    "how your knee is guided through each step. Knee discomfort can have many different causes, and "
    "this video can't tell you what is behind yours. What we can do is gently build strength in the "
    "muscles around your hips and thighs. Stretching has its place, but strengthening helps those "
    "muscles support you during everyday movement. We'll keep every movement slow, controlled, and "
    "within a range that feels comfortable for you.")

# Scene 3: Seated Knee Extension 1:45-3:50 (6 s per rep: ~2 s up, 1 s pause, 3 s down)
seg("knee-extension", 105, 134,
    "Our first movement is the seated knee extension. Choose a sturdy chair without wheels, ideally "
    "placed against a wall so it can't slide. Sit tall toward the front of the seat, with both feet "
    "flat on the floor and your hands resting on the seat or your thighs.")
seg("knee-extension", 135, 149,
    "Slowly straighten your right knee, lifting your foot until your leg is as straight as feels "
    "comfortable. Pause briefly, then lower it back down with control.")
counts("knee-extension", 150, 6)
seg("knee-extension", 180, 191,
    "Rest your foot on the floor. Now let's switch to the left leg. Same slow lift, brief pause, "
    "and controlled return.")
counts("knee-extension", 192, 6)
seg("knee-extension", 222, 229, "Nicely done. Take a breath before we stand up.")

# Scene 4: Supported Standing Hip Extension 3:50-5:50 (6 s per rep)
seg("hip-extension", 230, 247,
    "Next is the supported standing hip extension. Stand facing a sturdy counter, with both hands "
    "resting on it for support. Stand tall, feet about hip-width apart, knees soft.")
seg("hip-extension", 248, 261,
    "Keeping your upper body upright, gently move your right leg backward, just a short distance. "
    "You don't need to go far. Then slowly bring it back.")
counts("hip-extension", 262, 6)
seg("hip-extension", 292, 305,
    "Bring that foot back beside the other one. Now the left leg. Keep your chest lifted and avoid "
    "leaning forward.")
counts("hip-extension", 306, 6)
seg("hip-extension", 336, 348,
    "Well done. If you'd like, take a short rest before the last movement.")

# Scene 5: Supported Sit-to-Stand 5:50-7:30 (8 s per rep: ~3 s up, 1 s pause, 4 s down)
seg("sit-to-stand", 350, 381,
    "Our final movement is the supported sit-to-stand. Use the same sturdy chair, placed against a "
    "wall. Move toward the front of the seat, feet flat and about hip-width apart, slightly behind "
    "your knees. You're welcome to use your hands on the seat or armrests for support.")
seg("sit-to-stand", 382, 397,
    "Lean your chest slightly forward, press through your feet, and stand up tall. Then reach back "
    "for the chair and lower yourself slowly to the seat.")
counts("sit-to-stand", 398, 8)
seg("sit-to-stand", 438, 449,
    "If five feels like too many today, it's fine to do fewer. Stop if anything feels sharp or "
    "unsteady.")

# Scene 6: Closing 7:30-7:58
seg("closing", 451, 477,
    "That's Day 1 complete. A few gentle, consistent sessions are often more useful than trying to "
    "do everything at once. Before you go, please take a moment to complete today's check-in in the "
    "app. It helps shape what comes next for you. See you tomorrow.")

TOTAL = 478

SCENES = [
    ("intro", "Introduction", 0, 40),
    ("education", "How the hip, knee and ankle work together", 40, 105),
    ("knee-extension", "Seated Knee Extension", 105, 230),
    ("hip-extension", "Supported Standing Hip Extension", 230, 350),
    ("sit-to-stand", "Supported Sit-to-Stand", 350, 450),
    ("closing", "Closing", 450, 478),
]


def ts(s):
    h, rem = divmod(s, 3600)
    m, sec = divmod(rem, 60)
    return f"{int(h):02d}:{int(m):02d}:{sec:06.3f}"


def chunk(text, limit=80):
    """Split into sentence-based cues; long sentences split into balanced parts,
    preferring a comma near each target break."""
    out = []
    for s in re.split(r"(?<=[.!?])\s+", text.strip()):
        n = -(-len(s) // limit)
        while n > 1:
            target = len(s) // n
            commas = [m.end() for m in re.finditer(r", ", s) if abs(m.end() - target) < 18]
            cut = min(commas, key=lambda c: abs(c - target)) if commas else s.rfind(" ", 0, target + 6)
            out.append(s[:cut].strip())
            s = s[cut:].strip()
            n -= 1
        out.append(s)
    return out


def wrap2(line, width=42):
    if len(line) <= width:
        return line
    spaces = [i for i, ch in enumerate(line) if ch == " "]
    mid = min(spaces, key=lambda i: max(i, len(line) - i - 1))
    return line[:mid] + "\n" + line[mid + 1:]


cues = []
for scene, start, end, text in SEGMENTS:
    parts = chunk(text)
    total_chars = sum(len(p) for p in parts)
    t = start
    for p in parts:
        d = (end - start) * len(p) / total_chars
        cues.append((t, t + d - 0.05, wrap2(p)))
        t += d

with open(os.path.join(OUT, "day01-captions.vtt"), "w") as f:
    f.write("WEBVTT\n")
    f.write("Kind: captions\nLanguage: en\n\n")
    f.write("NOTE\nDRAFT - timings follow the planned edit timeline in day01-script.md.\n"
            "No narration audio exists yet. Re-time to the recorded voiceover before release.\n\n")
    for i, (a, b, txt) in enumerate(cues, 1):
        f.write(f"{i}\n{ts(a)} --> {ts(b)}\n{txt}\n\n")


def narration(scene):
    return " ".join(t for s, _, _, t in SEGMENTS if s == scene)


UNAPPROVED = {"status": "unapproved", "reviewedBy": None, "reviewedAt": None, "notes": None}

clip_files = {
    "intro": "day01-introduction.mp4",
    "education": None,  # education diagrams are cut into day01-introduction.mp4 or delivered separately; see notes
    "knee-extension": "day01-knee-extension.mp4",
    "hip-extension": "day01-hip-extension.mp4",
    "sit-to-stand": "day01-sit-to-stand.mp4",
    "closing": "day01-closing.mp4",
}

BASE = "public/videos/day-01/"

TRANSCRIPT_SRC = {
    "id": "src-tone-and-tighten-knee-hip",
    "title": "Tone and Tighten - knee strengthening video presented by Dr. Jared, PT",
    "role": "Primary educational concept (hip/ankle influence on knee, strengthening over stretching-only, controlled technique) and future exercise library: single-leg bridge, lateral hip hike, lateral band walk, single-leg balance with reaches, single-leg deadlift.",
    "usage": "Concept reference only. No narration, footage, identity or branding reproduced.",
    "url": None,
    "transcriptOnFile": False,
}

exercises = [
    {
        "id": "ex-seated-knee-extension",
        "name": "Seated Knee Extension",
        "sceneId": "knee-extension",
        "sides": ["right", "left"],
        "proposedDose": {"sets": 1, "reps": 5, "perSide": True, "tempo": "~2 s lift, 1 s pause, ~3 s lower",
                         "status": "draft - pending clinical review"},
        "equipment": ["sturdy non-wheeled chair, ideally against a wall"],
        "sourceRefs": [{"id": "src-seated-knee-strengthening",
                        "title": "Seated knee-strengthening transcript (previously supplied by producer)",
                        "transcriptOnFile": False}],
        "safetyNotes": [
            "Use a stable chair without wheels; place it against a wall if possible.",
            "Straighten only as far as feels comfortable; full straightening is not required.",
            "Lower the leg with control rather than letting it drop.",
            "Stop if you feel sharp pain, pain that builds, or cramping.",
        ],
    },
    {
        "id": "ex-supported-standing-hip-extension",
        "name": "Supported Standing Hip Extension",
        "sceneId": "hip-extension",
        "sides": ["right", "left"],
        "proposedDose": {"sets": 1, "reps": 5, "perSide": True, "tempo": "~2 s back, 1 s pause, ~3 s return",
                         "status": "draft - pending clinical review"},
        "equipment": ["stable kitchen counter or fixed surface at about hip height"],
        "sourceRefs": [{"id": "src-ed-deboo-home-strengthening",
                        "title": "Ed Deboo home-strengthening transcript (previously supplied by producer)",
                        "transcriptOnFile": False}],
        "safetyNotes": [
            "Keep both hands on a stable, fixed surface throughout.",
            "Move the leg only a short distance; avoid arching the lower back or leaning the trunk forward.",
            "Wear supportive footwear on a non-slip floor.",
            "Stop if you feel unsteady, dizzy, or experience sharp pain.",
        ],
    },
    {
        "id": "ex-supported-sit-to-stand",
        "name": "Supported Sit-to-Stand",
        "sceneId": "sit-to-stand",
        "sides": ["both"],
        "proposedDose": {"sets": 1, "reps": 5, "perSide": False, "tempo": "~3 s up, 1 s pause, ~4 s down",
                         "condition": "when appropriate; fewer repetitions are acceptable",
                         "status": "draft - pending clinical review"},
        "equipment": ["sturdy non-wheeled chair against a wall; armrests optional"],
        "sourceRefs": [{"id": "src-functional-strength-sit-to-stand",
                        "title": "Functional-strength and sit-to-stand transcripts (previously supplied by producer)",
                        "transcriptOnFile": False}],
        "safetyNotes": [
            "Chair must not move: no wheels, back against a wall.",
            "Use hands on the seat or armrests for support as needed.",
            "Lower slowly; avoid dropping into the seat.",
            "Do fewer repetitions or skip if standing up causes sharp pain, dizziness, or unsteadiness.",
        ],
    },
]

clips = []
for sid, title, a, b in SCENES:
    f = clip_files[sid]
    clips.append({
        "sceneId": sid,
        "title": title,
        # Only files that exist on disk get a path; the rest carry their target name only.
        "file": BASE + f if f and os.path.exists(os.path.join(OUT, f)) else None,
        "targetFileName": f,
        "timelineStart": a,
        "timelineEnd": b,
        "plannedDurationSec": b - a,
        "actualDurationSec": None,
        "narration": narration(sid),
        "mediaGenerationStatus": "not_generated",
        "movementQualityApproval": dict(UNAPPROVED),
        "higgsfieldShotIds": [],
    })

shot_map = {
    "intro": ["S1-A", "S1-B", "S1-C"],
    "education": ["S2-A", "S2-B", "S2-C", "S2-D"],
    "knee-extension": ["S3-A", "S3-B", "S3-C", "S3-D", "S3-E"],
    "hip-extension": ["S4-A", "S4-B", "S4-C", "S4-D", "S4-E"],
    "sit-to-stand": ["S5-A", "S5-B", "S5-C", "S5-D"],
    "closing": ["S6-A", "S6-B"],
}
for c in clips:
    c["higgsfieldShotIds"] = shot_map[c["sceneId"]]
    if c["sceneId"] == "education":
        c["notes"] = ("Recommended as motion-graphics diagrams (not AI video) for anatomical accuracy. "
                      "Edit into the start of day01-introduction.mp4 or export as day01-education.mp4 "
                      "and add to this manifest.")

existing = lambda f: os.path.exists(os.path.join(OUT, f))

manifest = {
    "schemaVersion": 1,
    "dayId": "day-01",
    "dayNumber": 1,
    "sessionTitle": "Build Stronger Support for Your Knees",
    "description": ("An introduction to how the hips and leg muscles work with the knee during everyday "
                    "movement, followed by three gentle, supported strengthening movements: seated knee "
                    "extension, supported standing hip extension, and supported sit-to-stand."),
    "audience": "Adults aged 50-70, including beginners",
    "plannedTotalDurationSec": TOTAL,
    "contentStatus": "draft",
    "publish": False,
    "exerciseIds": [e["id"] for e in exercises],
    "exercises": exercises,
    "sourceReferences": [TRANSCRIPT_SRC] + [r for e in exercises for r in e["sourceRefs"]],
    "media": {
        "clips": clips,
        "complete": {"file": BASE + "day01-complete.mp4" if existing("day01-complete.mp4") else None,
                     "targetFileName": "day01-complete.mp4",
                     "mediaGenerationStatus": "not_produced"},
        "poster": {"file": BASE + "day01-poster.jpg" if existing("day01-poster.jpg") else None,
                   "type": "typographic placeholder (no AI imagery)",
                   "notes": "Replace with a still from approved footage once available."},
        "captions": {"file": BASE + "day01-captions.vtt", "language": "en",
                     "status": "draft - timed to planned timeline, not to recorded audio"},
        "script": BASE + "day01-script.md",
        "higgsfieldPrompts": BASE + "day01-higgsfield-prompts.md",
    },
    "generalSafetyNotes": [
        "This session is educational and does not diagnose or treat any condition.",
        "Knee discomfort can have many causes. Check with a doctor or physical therapist before starting, "
        "especially after recent injury, surgery, or joint replacement, or if you have balance concerns.",
        "Move within a comfortable range. Stop if you feel sharp pain, pain that builds, dizziness, "
        "chest discomfort, or unsteadiness.",
        "Use only stable, non-wheeled chairs and fixed support surfaces.",
        "No exercise is suitable for everyone; fewer repetitions or skipping an exercise is always acceptable.",
    ],
    "generation": {
        "tool": "Higgsfield CLI (@higgsfield/cli)",
        "mediaGenerationStatus": "test_only",
        "videoModel": "kling3_0 (std, silent, start/end frame = instructor reference)",
        "imageModel": "nano_banana_pro (16:9, 2k)",
    },
    # Pilot assets generated to validate instructor, set and model before full production.
    "testAssets": [
        {
            "id": "test-instructor-reference",
            "file": BASE + "day01-instructor-reference.jpg",
            "type": "image",
            "model": "nano_banana_pro",
            "higgsfieldJobId": "99768b5a-3f7b-484f-af71-aa17abd6cc2e",
            "creditsSpent": 2,
            "mediaGenerationStatus": "generated",
            "role": "Consistent instructor + set reference; start/end frame for seated exercise clips",
            "reviewNotes": [
                "Instructor reads as ~60-65, realistic proportions, five fingers visible on near hand.",
                "Chair: four wooden legs, no wheels, armless.",
                "Chair is NOT against a wall (sits mid-room), contradicting the script's setup cue.",
                "Side-on view rather than three-quarter; works well for showing knee angle.",
            ],
            "approval": dict(UNAPPROVED),
        },
        {
            "id": "test-knee-extension-left-rep",
            "file": BASE + "day01-test-knee-extension-left-rep.mp4",
            "type": "video",
            "exerciseId": "ex-seated-knee-extension",
            "side": "left",
            "model": "kling3_0",
            "higgsfieldJobId": "3273f4d4-aceb-4dbc-a078-592837d5713a",
            "creditsSpent": 7.5,
            "durationSec": 5.04,
            "resolution": "1284x716 @ 24 fps, no audio",
            "repsShown": 1,
            "measuredTiming": {"stillStart": "0.0-0.6 s", "lift": "0.6-2.1 s", "hold": "2.1-2.9 s",
                               "lower": "2.9-4.4 s", "stillEnd": "4.4-5.0 s"},
            "loopable": True,
            "mediaGenerationStatus": "generated",
            "reviewNotes": [
                "Exactly one repetition; knee hinges in a plausible direction, thigh stays on seat.",
                "Opposite foot stays flat; hands stay on seat edge; trunk upright; chair does not move.",
                "Camera stationary (background drift within compression noise); first and last frames match, so it loops cleanly.",
                "Range is partial: knee reaches roughly 130-140 degrees, not 'nearly straight'.",
                "Ankle drifts into a slightly pointed position at the top instead of toes up.",
                "Rep is ~3.8 s, quicker than the script's 6 s tempo; hold the first frame ~1 s per loop or retime counts.",
                "Chair placed mid-room, not against a wall.",
            ],
            "approval": dict(UNAPPROVED),
        },
        {
            "id": "test-instructor-reference-v2",
            "file": BASE + "day01-instructor-reference-v2.jpg",
            "type": "image",
            "model": "nano_banana_pro (edit of test-instructor-reference)",
            "higgsfieldJobId": "65f74ef2-1c68-48ea-ba5b-dad0a682b789",
            "creditsSpent": 2,
            "mediaGenerationStatus": "generated",
            "supersedes": "test-instructor-reference",
            "role": "Current instructor + set reference; start/end frame for seated exercise clips",
            "reviewNotes": [
                "Same face, hair, clothing, pose, camera angle and framing as v1.",
                "Plain side wall added; chair backrest rests against it at a glance.",
                "Perspective is ambiguous: the side-wall baseboard suggests the rear legs may sit slightly forward of the wall. Reviewer to confirm it reads as 'against the wall'.",
                "Chair: four legs, no wheels. Full body, both feet and all chair legs visible.",
            ],
            "approval": dict(UNAPPROVED),
        },
        {
            "id": "test-knee-extension-left-rep-v2",
            "file": BASE + "day01-test-knee-extension-left-rep-v2.mp4",
            "type": "video",
            "exerciseId": "ex-seated-knee-extension",
            "side": "left",
            "model": "kling3_0",
            "higgsfieldJobId": "99922234-4fb5-4606-8154-eec5b77338b4",
            "creditsSpent": 7.5,
            "durationSec": 5.04,
            "resolution": "1284x716 @ 24 fps, no audio",
            "repsShown": 1,
            "measuredTiming": {"stillStart": "0.0-0.6 s", "lift": "0.6-1.5 s", "hold": "1.5-2.7 s",
                               "lower": "2.7-3.9 s", "stillEnd": "3.9-5.0 s"},
            "loopable": True,
            "mediaGenerationStatus": "generated",
            "supersedes": "test-knee-extension-left-rep",
            "reviewNotes": [
                "Exactly one repetition; knee reaches near-straight (~160 degrees) without locking.",
                "Toes pulled up with sole facing forward at the top, as requested.",
                "Thigh stays on the seat; opposite foot flat and still; torso upright; hands stay on seat edge.",
                "Camera and chair stationary (frame differences within compression noise); first/last frames match.",
                "Lift is quick (~0.9 s) versus the requested ~2 s; lowering ~1.2 s. Movement is smooth but brisk.",
                "No visible joint artifacts, foot sliding, shoe morphing or proportion changes.",
            ],
            "approval": dict(UNAPPROVED),
        },
    ],
    "approvals": {
        "movementQuality": dict(UNAPPROVED),
        "clinicalContent": dict(UNAPPROVED),
        "safetyCopy": dict(UNAPPROVED),
        "captions": dict(UNAPPROVED),
    },
}

with open(os.path.join(OUT, "day01-manifest.json"), "w") as f:
    json.dump(manifest, f, indent=2)
    f.write("\n")

print(len(cues), "cues;", TOTAL, "s total")
