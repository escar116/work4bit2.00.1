import os
from gtts import gTTS
import imageio_ffmpeg
import subprocess

OUTPUT_DIR = os.path.abspath("./video_narration")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 3-minute comprehensive script matching the Work 4 A Bit platform
SCRIPT_PARTS = [
    {
        "file_prefix": "01_intro",
        "time": "0:00 - 0:25",
        "section": "1. Project Overview & Dashboard",
        "cue": "Start on Dashboard or Landing view. Show header, user profile, and overview stats.",
        "text": (
            "Welcome to Work 4 A Bit, a specialized campus freelance and collaborative skill-exchange platform "
            "designed specifically for university engineering and technical students. The platform connects student "
            "freelancers offering specialized technical services with fellow students and clients who need assistance "
            "on academic and engineering projects."
        )
    },
    {
        "file_prefix": "02_auth_verification",
        "time": "0:25 - 0:50",
        "section": "2. Authentication & Faculty Verification",
        "cue": "Show registration page or profile view highlighting the faculty reference and verified student badge.",
        "text": (
            "To maintain academic integrity and safety, Work 4 A Bit features a verified onboarding system. "
            "During registration, students designate their academic faculty reference and upload official credentials "
            "or certificates. This ensures every freelancer and client on the platform is a verified university member."
        )
    },
    {
        "file_prefix": "03_marketplace",
        "time": "0:50 - 1:30",
        "section": "3. Services Marketplace & Posting",
        "cue": "Click 'Services' in sidebar. Switch between Offers and Requests. Click 'Post a Service' or open an offer details modal.",
        "text": (
            "In the Services Marketplace, users can browse both Service Offers and Service Requests across diverse categories "
            "such as 3D Design, PCB layout, Embedded Systems, and Web Development. Each listing displays transparent student pricing, "
            "detailed descriptions, and project photos. Students can easily publish new listings or edit existing posts with reference cover photos."
        )
    },
    {
        "file_prefix": "04_mentoring",
        "time": "1:30 - 2:05",
        "section": "4. Mentoring Hub",
        "cue": "Click 'Mentoring' in sidebar. Demonstrate filtering by skills like Python, CAD, Circuit Design.",
        "text": (
            "Work 4 A Bit also features a dedicated Mentoring Hub. Here, senior students and certified peer mentors "
            "share their expertise in subjects like Robotics, Python, AutoCAD, and Circuit Simulation. Students seeking technical guidance "
            "can search mentors by verified skillsets and reach out directly for one-on-one academic consultation."
        )
    },
    {
        "file_prefix": "05_collab_messages",
        "time": "2:05 - 2:35",
        "section": "5. Applications & Real-time Messaging",
        "cue": "Navigate to 'Applications' hub (Posted vs Applied tabs), then click 'Messages' and show a chat conversation.",
        "text": (
            "Managing collaborative work is seamless through the Applications Hub, where job posters can review student proposals "
            "and approve orders. The integrated real-time Messaging system allows clients and freelancers to communicate directly, "
            "share project specifications, negotiate project milestones, and coordinate deliverables safely within the portal."
        )
    },
    {
        "file_prefix": "06_admin",
        "time": "2:35 - 2:55",
        "section": "6. Admin Governance & User Analytics",
        "cue": "Navigate to 'Admin' section. Show pending student approvals, certificate preview, and active/online student statistics.",
        "text": (
            "For platform administrators, the Admin Dashboard provides comprehensive governance tools. Administrators can inspect "
            "student credentials, review submitted certificates, approve pending registrations, and monitor real-time platform metrics "
            "such as verified members, active transactions, and live online user presence."
        )
    },
    {
        "file_prefix": "07_conclusion",
        "time": "2:55 - 3:00",
        "section": "7. Conclusion",
        "cue": "Return to Dashboard or show whole screen. Conclude presentation.",
        "text": (
            "Work 4 A Bit bridges academic knowledge and practical industry skills, empowering students to earn, learn, "
            "and collaborate. Thank you for watching."
        )
    }
]

def generate_voiceovers():
    print("Generating individual scene audio clips...")
    for part in SCRIPT_PARTS:
        filename = f"{part['file_prefix']}.mp3"
        filepath = os.path.join(OUTPUT_DIR, filename)
        tts = gTTS(text=part["text"], lang='en', tld='com', slow=False)
        tts.save(filepath)
        print(f"  [+] Saved {part['time']} ({part['section']}) -> {filename}")

    full_text = " ".join([part["text"] for part in SCRIPT_PARTS])
    full_audio = os.path.join(OUTPUT_DIR, "work4bit_voiceover_full.mp3")
    print(f"\nGenerating master continuous voiceover -> work4bit_voiceover_full.mp3...")
    tts_master = gTTS(text=full_text, lang='en', tld='com', slow=False)
    tts_master.save(full_audio)
    print("All voiceover audio generated successfully!")

if __name__ == "__main__":
    generate_voiceovers()
