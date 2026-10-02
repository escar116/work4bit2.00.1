import os
import sys
import subprocess
import imageio_ffmpeg

def merge(video_file, audio_file=None, output_file=None):
    if not os.path.exists(video_file):
        print(f"Error: Video file not found: {video_file}")
        return False

    if not audio_file:
        audio_file = os.path.join(os.path.dirname(__file__), "work4bit_voiceover_full.mp3")

    if not os.path.exists(audio_file):
        print(f"Error: Audio file not found: {audio_file}")
        return False

    if not output_file:
        dir_name = os.path.dirname(video_file) or "."
        output_file = os.path.join(dir_name, "work4bit_final_presentation.mp4")

    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    print("--------------------------------------------------")
    print(f"Merging Video: {video_file}")
    print(f"With AI Voiceover: {audio_file}")
    print(f"Target Output: {output_file}")
    print("--------------------------------------------------")

    # Command to replace/add audio to video:
    # -c:v copy preserves video quality instantly without re-encoding
    # -c:a aac encodes clean audio
    # -shortest matches video or audio length cleanly
    cmd = [
        ffmpeg_exe,
        "-y",
        "-i", video_file,
        "-i", audio_file,
        "-c:v", "copy",
        "-c:a", "aac",
        "-b:a", "192k",
        "-map", "0:v:0",
        "-map", "1:a:0",
        "-shortest",
        output_file
    ]

    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if result.returncode == 0:
        print(f"SUCCESS! Final presentation video created at:\n{os.path.abspath(output_file)}")
        return True
    else:
        print("Fallback re-encoding video to ensure compatibility...")
        cmd_fallback = [
            ffmpeg_exe,
            "-y",
            "-i", video_file,
            "-i", audio_file,
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            "-b:a", "192k",
            "-map", "0:v:0",
            "-map", "1:a:0",
            "-shortest",
            output_file
        ]
        res2 = subprocess.run(cmd_fallback, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if res2.returncode == 0:
            print(f"SUCCESS! Final presentation video created at:\n{os.path.abspath(output_file)}")
            return True
        else:
            print("FFmpeg error:", res2.stderr)
            return False

if __name__ == "__main__":
    if len(sys.argv) > 1:
        video_path = sys.argv[1]
    else:
        # Search for any mp4 in the folder that is not the final output
        current_dir = os.path.dirname(__file__) or "."
        mp4s = [f for f in os.listdir(current_dir) if f.endswith(".mp4") and "final" not in f.lower()]
        if mp4s:
            video_path = os.path.join(current_dir, mp4s[0])
            print(f"Auto-detected recording: {video_path}")
        else:
            print("Usage: python merge_video.py <path_to_your_screen_recording.mp4>")
            sys.exit(1)

    merge(video_path)
