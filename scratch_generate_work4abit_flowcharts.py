import os
import shutil
import asyncio
from playwright.async_api import async_playwright

OUT_DIR = r"C:/Users/charles/.gemini/antigravity/brain/2dcbce95-d155-4f78-82c5-cabf4dd81ced"
PROJECT_DIR = r"c:/Users/charles/PycharmProjects/Website"
os.makedirs(OUT_DIR, exist_ok=True)

# High-contrast, sharp academic styling (matching Reference PDF layout)
SVG_HEADER = '''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" style="background-color: #ffffff; font-family: 'Times New Roman', Times, serif;">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#111827" />
    </marker>
    <filter id="subtle-shadow" x="-3%" y="-3%" width="106%" height="106%">
      <feDropShadow dx="0" dy="1" stdDeviation="0.8" flood-color="#000000" flood-opacity="0.04" />
    </filter>
  </defs>
  <style>
    .shape {{ fill: #ffffff; stroke: #111827; stroke-width: 2; }}
    .line {{ fill: none; stroke: #111827; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }}
    .text-main {{ font-size: 13.5px; font-weight: 500; fill: #111827; text-anchor: middle; dominant-baseline: central; }}
    .text-bold {{ font-size: 13.5px; font-weight: bold; fill: #111827; text-anchor: middle; dominant-baseline: central; }}
    .text-title {{ font-size: 20px; font-weight: bold; fill: #000000; text-anchor: start; }}
    .text-caption {{ font-size: 16px; font-weight: bold; fill: #000000; text-anchor: middle; }}
    .text-branch {{ font-size: 12.5px; font-weight: bold; fill: #111827; text-anchor: middle; }}
    .page-num {{ font-size: 15px; fill: #000000; text-anchor: end; }}
  </style>
'''

def wrap_text(lines, cx, cy, line_height=17, is_bold=False):
    cls = "text-bold" if is_bold else "text-main"
    total_h = len(lines) * line_height
    start_y = cy - (total_h / 2) + (line_height / 2)
    res = []
    for i, line in enumerate(lines):
        y = start_y + i * line_height
        res.append(f'<text x="{cx}" y="{y}" class="{cls}">{line}</text>')
    return '\n'.join(res)

def oval(x, y, w, h, text, is_bold=True):
    r = h / 2
    cx = x + w / 2
    cy = y + h / 2
    return f'''
    <rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" ry="{r}" class="shape" filter="url(#subtle-shadow)" />
    {wrap_text([text], cx, cy, is_bold=is_bold)}
    '''

def process(x, y, w, h, lines):
    # Strict Rectangle: Process ONLY
    cx = x + w / 2
    cy = y + h / 2
    return f'''
    <rect x="{x}" y="{y}" width="{w}" height="{h}" class="shape" filter="url(#subtle-shadow)" />
    {wrap_text(lines, cx, cy)}
    '''

def io(x, y, w, h, lines, skew=18):
    # Strict Parallelogram: Input / Output ONLY
    cx = x + w / 2
    cy = y + h / 2
    pts = f"{x+skew},{y} {x+w},{y} {x+w-skew},{y+h} {x},{y+h}"
    return f'''
    <polygon points="{pts}" class="shape" filter="url(#subtle-shadow)" />
    {wrap_text(lines, cx, cy)}
    '''

def decision(x, y, w, h, lines):
    # Strict Diamond: Decision ONLY (Yes/No branches)
    cx = x + w / 2
    cy = y + h / 2
    pts = f"{cx},{y} {x+w},{cy} {cx},{y+h} {x},{cy}"
    return f'''
    <polygon points="{pts}" class="shape" filter="url(#subtle-shadow)" />
    {wrap_text(lines, cx, cy)}
    '''

def connector_pentagon(x, y, w, h, label, direction='right'):
    cx = x + w / 2
    cy = y + h / 2
    if direction == 'right':
        tip_w = h / 2
        pts = f"{x},{y} {x+w-tip_w},{y} {x+w},{cy} {x+w-tip_w},{y+h} {x},{y+h}"
        text_x = x + (w - tip_w/2) / 2
    elif direction == 'down':
        tip_h = w / 2
        pts = f"{x},{y} {x+w},{y} {x+w},{y+h-tip_h} {cx},{y+h} {x},{y+h-tip_h}"
        text_x = cx
        cy = y + (h - tip_h/2) / 2
    elif direction == 'left':
        tip_w = h / 2
        pts = f"{x+tip_w},{y} {x+w},{y} {x+w},{y+h} {x+tip_w},{y+h} {x},{cy}"
        text_x = x + tip_w/2 + (w - tip_w) / 2
    return f'''
    <polygon points="{pts}" class="shape" filter="url(#subtle-shadow)" />
    <text x="{text_x}" y="{cy}" class="text-bold">{label}</text>
    '''

def connector_circle(cx, cy, r, label):
    return f'''
    <circle cx="{cx}" cy="{cy}" r="{r}" class="shape" filter="url(#subtle-shadow)" />
    <text x="{cx}" y="{cy}" class="text-bold">{label}</text>
    '''

def poly_arrow(pts):
    pts_str = " ".join([f"{px},{py}" for px, py in pts])
    return f'<polyline points="{pts_str}" class="line" marker-end="url(#arrow)" />'

def poly_line(pts):
    pts_str = " ".join([f"{px},{py}" for px, py in pts])
    return f'<polyline points="{pts_str}" class="line" />'

def line_arrow(x1, y1, x2, y2):
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" class="line" marker-end="url(#arrow)" />'

def plain_line(x1, y1, x2, y2):
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" class="line" />'

def branch_label(x, y, text):
    return f'<text x="{x}" y="{y}" class="text-branch">{text}</text>'

# =========================================================================
# DIAGRAM 1: Fig. 6.1.1. Work4ABit Landing Page
# =========================================================================
def build_diagram_1():
    w, h = 850, 1180
    parts = [SVG_HEADER.format(w=w, h=h)]
    
    parts.append('<text x="80" y="65" class="text-title">FLOWCHART</text>')
    
    # Center X = 400
    # START terminal
    parts.append(oval(345, 85, 110, 40, "START"))
    parts.append(line_arrow(400, 125, 400, 160))
    
    # Display landing page (I/O)
    parts.append(io(285, 160, 230, 52, ["Display landing page"], skew=18))
    
    # Connector 1 pointing left (incoming from click sign out)
    parts.append(connector_pentagon(590, 164, 58, 44, "1", direction="left"))
    parts.append(line_arrow(590, 186, 505, 186))
    
    # Check user session (Process)
    parts.append(line_arrow(400, 212, 400, 250))
    parts.append(process(285, 250, 230, 44, ["Check user session"]))
    
    # User logged in? (Decision)
    parts.append(line_arrow(400, 294, 400, 332))
    parts.append(decision(295, 332, 210, 62, ["User logged in?"]))
    
    # ---------------- YES BRANCH (Right) ----------------
    parts.append(line_arrow(505, 363, 565, 363))
    parts.append(branch_label(535, 353, "Yes"))
    parts.append(decision(565, 332, 180, 62, ["Account approved?"]))
    
    # Approved Yes -> Connector 3 (Role Router)
    parts.append(line_arrow(745, 363, 785, 363))
    parts.append(branch_label(765, 353, "Yes"))
    parts.append(connector_pentagon(785, 341, 50, 44, "3", direction="right"))
    
    # Approved No -> Wait for admin approval (I/O)
    parts.append(line_arrow(655, 394, 655, 424))
    parts.append(branch_label(670, 410, "No"))
    parts.append(io(550, 424, 210, 48, ["Wait for admin approval"], skew=18))
    
    # Wait notice joins the exit check at bottom via right margin
    parts.append(poly_arrow([(655, 472), (790, 472), (790, 915), (605, 915)]))
    
    # ---------------- NO BRANCH (Down) ----------------
    # Click login? (Decision)
    parts.append(line_arrow(400, 394, 400, 502))
    parts.append(branch_label(385, 412, "No"))
    parts.append(decision(295, 502, 210, 62, ["Click login?"]))
    
    # Click login Yes -> Connector 2 (Authentication)
    parts.append(line_arrow(505, 533, 570, 533))
    parts.append(branch_label(537, 523, "Yes"))
    parts.append(connector_pentagon(570, 511, 58, 44, "2", direction="right"))
    
    # Click login No -> Click explore services? (Decision)
    parts.append(line_arrow(400, 564, 400, 604))
    parts.append(branch_label(385, 584, "No"))
    parts.append(decision(285, 604, 230, 62, ["Click explore services?"]))
    
    # Explore Yes -> Connector 6 (Service Engagement)
    parts.append(line_arrow(515, 635, 570, 635))
    parts.append(branch_label(542, 625, "Yes"))
    parts.append(connector_pentagon(570, 613, 58, 44, "6", direction="right"))
    
    # Explore No -> branches down-left to Getting Started
    parts.append(poly_arrow([(400, 666), (400, 695), (215, 695), (215, 725)]))
    parts.append(branch_label(295, 685, "No"))
    
    # Click getting started? (Decision)
    parts.append(decision(125, 725, 180, 58, ["Click getting", "started?"]))
    parts.append(line_arrow(305, 754, 360, 754))
    parts.append(branch_label(332, 744, "Yes"))
    
    # Display getting started (I/O)
    parts.append(io(360, 730, 195, 48, ["Display getting started"], skew=18))
    
    # Getting started connects to Click back?
    parts.append(line_arrow(545, 754, 595, 754))
    
    # Click back? (Decision)
    parts.append(decision(595, 725, 155, 58, ["Click back?"]))
    
    # Click back? No -> loops back up to Display getting started
    parts.append(poly_arrow([(672.5, 725), (672.5, 700), (457.5, 700), (457.5, 730)]))
    parts.append(branch_label(685, 712, "No"))
    
    # Click back? Yes (Down) -> enters Click exit?
    parts.append(poly_arrow([(672.5, 783), (672.5, 915), (605, 915)]))
    parts.append(branch_label(688, 850, "Yes"))
    
    # Click getting started No -> joins left margin bus
    parts.append(poly_line([(215, 783), (215, 940), (75, 940)]))
    parts.append(branch_label(200, 850, "No"))
    
    # Click exit? (Decision)
    parts.append(decision(445, 888, 160, 54, ["Click exit?"]))
    
    # Yes -> FINISH
    parts.append(line_arrow(445, 915, 375, 915))
    parts.append(branch_label(410, 905, "Yes"))
    parts.append(oval(275, 895, 100, 40, "FINISH"))
    
    # Click exit? No -> loops all the way back to Display landing page via left bus
    parts.append(poly_arrow([
        (525, 942), (525, 975), (75, 975), (75, 186), (285, 186)
    ]))
    parts.append(branch_label(510, 960, "No"))
    
    # Caption and page
    parts.append('<text x="425" y="1050" class="text-caption">Fig. 6.1.1. Work4ABit Landing Page</text>')
    parts.append('<text x="760" y="1100" class="page-num">22</text>')
    
    parts.append('</svg>')
    return '\n'.join(parts)

# =========================================================================
# DIAGRAM 2: Fig. 6.1.2. Student & Admin Authentication and Registration
# =========================================================================
def build_diagram_2():
    w, h = 850, 1150
    parts = [SVG_HEADER.format(w=w, h=h)]
    
    # Connector 2 pointing down at top
    parts.append(connector_pentagon(235, 55, 50, 50, "2", direction="down"))
    parts.append(line_arrow(260, 105, 260, 150))
    
    # Display login modal (I/O)
    parts.append(io(170, 150, 180, 50, ["Display login modal"], skew=18))
    
    # On-page connector A pointing into right side of Display login modal
    parts.append(connector_circle(405, 175, 18, "A"))
    parts.append(line_arrow(387, 175, 345, 175))
    
    # Click sign up? (Decision)
    parts.append(line_arrow(260, 200, 260, 245))
    parts.append(decision(165, 245, 190, 60, ["Click sign up?"]))
    
    # Yes -> Enter credentials (I/O)
    parts.append(line_arrow(355, 275, 405, 275))
    parts.append(branch_label(380, 265, "Yes"))
    parts.append(io(405, 250, 190, 50, ["Enter credentials"], skew=18))
    
    # Save account details (Process)
    parts.append(line_arrow(585, 275, 630, 275))
    parts.append(process(630, 252.5, 150, 45, ["Save account details"]))
    
    # Details valid? (Decision)
    parts.append(line_arrow(705, 297.5, 705, 340))
    parts.append(decision(615, 340, 180, 60, ["Details valid?"]))
    
    # Retry loop back into registration input
    parts.append(poly_arrow([(795, 370), (815, 370), (815, 215), (500, 215), (500, 250)]))
    parts.append(branch_label(805, 360, "No"))
    
    # Details valid Yes -> Wait for admin approval (I/O)
    parts.append(line_arrow(705, 400, 705, 445))
    parts.append(branch_label(720, 420, "Yes"))
    parts.append(io(600, 445, 210, 50, ["Wait for admin approval"], skew=18))
    
    # Wait for admin approval -> Connector A (on-page)
    parts.append(poly_arrow([(705, 495), (705, 558), (461, 558)]))
    parts.append(connector_circle(442.5, 558, 18, "A"))
    
    # Click sign up No -> Sign in with Google? (Decision)
    parts.append(line_arrow(260, 305, 260, 600))
    parts.append(branch_label(275, 335, "No"))
    parts.append(decision(165, 600, 190, 60, ["Sign in with Google?"]))
    
    # Google Auth Yes -> Process OAuth
    parts.append(line_arrow(355, 630, 405, 630))
    parts.append(branch_label(380, 620, "Yes"))
    parts.append(process(405, 607.5, 170, 45, ["Sign in with Google"]))
    
    # Login successful? (Decision)
    parts.append(line_arrow(575, 630, 615, 630))
    parts.append(decision(615, 600, 170, 60, ["Login successful?"]))
    
    # OAuth Yes -> Connector 3
    parts.append(poly_arrow([(785, 630), (810, 630), (810, 715)]))
    parts.append(branch_label(798, 620, "Yes"))
    parts.append(connector_pentagon(785, 715, 50, 50, "3", direction="down"))
    
    # OAuth No -> Connector A
    parts.append(poly_arrow([(700, 660), (700, 725), (575, 725)]))
    parts.append(branch_label(680, 690, "No"))
    parts.append(connector_circle(557, 725, 18, "A"))
    
    # Google Auth No -> Enter email and password (I/O)
    parts.append(line_arrow(260, 660, 260, 710))
    parts.append(branch_label(275, 685, "No"))
    parts.append(io(155, 710, 210, 50, ["Enter email and password"], skew=18))
    
    # Verify credentials (Process)
    parts.append(line_arrow(260, 760, 260, 800))
    parts.append(process(175, 800, 170, 44, ["Verify credentials"]))
    
    # Valid credentials? (Decision)
    parts.append(line_arrow(260, 844, 260, 885))
    parts.append(decision(165, 885, 190, 60, ["Valid credentials?"]))
    
    # Yes -> Connector 3
    parts.append(poly_arrow([(355, 915), (785, 915), (785, 765)]))
    parts.append(branch_label(410, 905, "Yes"))
    
    # No -> loops to login modal via left bus
    parts.append(poly_arrow([(165, 915), (120, 915), (120, 175), (170, 175)]))
    parts.append(branch_label(140, 905, "No"))
    
    # Caption and page
    parts.append('<text x="425" y="1010" class="text-caption">Fig. 6.1.2. Student &amp; Admin Authentication and Registration</text>')
    parts.append('<text x="760" y="1060" class="page-num">23</text>')
    
    parts.append('</svg>')
    return '\n'.join(parts)

# =========================================================================
# DIAGRAM 3: Fig. 6.1.3. Role Router (Admin and Student Dashboard Dispatch)
# =========================================================================
def build_diagram_3():
    w, h = 820, 860
    parts = [SVG_HEADER.format(w=w, h=h)]
    
    # Connector 3 pointing down at top
    parts.append(connector_pentagon(385, 70, 50, 50, "3", direction="down"))
    parts.append(line_arrow(410, 120, 410, 170))
    
    # Check user role (Process)
    parts.append(process(310, 170, 200, 44, ["Check user role"]))
    parts.append(line_arrow(410, 214, 410, 260))
    
    # Is user an Admin? (Decision)
    parts.append(decision(300, 260, 220, 70, ["Is user an Admin?"]))
    
    # Yes (Left) -> Admin Dashboard
    parts.append(line_arrow(300, 295, 245, 295))
    parts.append(branch_label(275, 285, "Yes"))
    parts.append(io(65, 268, 180, 54, ["Display admin dashboard"], skew=18))
    
    # Load Admin data (Process)
    parts.append(line_arrow(155, 322, 155, 385))
    parts.append(process(70, 385, 170, 45, ["Load admin data"]))
    
    # Connector 4 pointing down
    parts.append(line_arrow(155, 430, 155, 490))
    parts.append(connector_pentagon(130, 490, 50, 50, "4", direction="down"))
    
    # No (Right) -> Student Dashboard
    parts.append(line_arrow(520, 295, 575, 295))
    parts.append(branch_label(545, 285, "No"))
    parts.append(io(575, 268, 180, 54, ["Display dashboard"], skew=18))
    
    # Load Student data (Process)
    parts.append(line_arrow(665, 322, 665, 385))
    parts.append(process(580, 385, 170, 45, ["Load student data"]))
    
    # Connector 5 pointing down
    parts.append(line_arrow(665, 430, 665, 490))
    parts.append(connector_pentagon(640, 490, 50, 50, "5", direction="down"))
    
    # Caption and page
    parts.append('<text x="410" y="640" class="text-caption">Fig. 6.1.3. Role Router (Admin and Student Dashboard)</text>')
    parts.append('<text x="740" y="690" class="page-num">24</text>')
    
    parts.append('</svg>')
    return '\n'.join(parts)

# =========================================================================
# DIAGRAM 4: Fig. 6.1.4. Admin Dashboard
# =========================================================================
def build_diagram_4():
    w, h = 880, 1180
    parts = [SVG_HEADER.format(w=w, h=h)]
    
    # Connector 4 pointing down
    parts.append(connector_pentagon(285, 35, 50, 50, "4", direction="down"))
    parts.append(line_arrow(310, 85, 310, 125))
    
    # Load platform data (Process)
    parts.append(process(215, 125, 190, 44, ["Load admin data"]))
    parts.append(line_arrow(310, 169, 310, 205))
    
    # Display admin dashboard (I/O)
    parts.append(io(175, 205, 270, 52, ["Display admin dashboard"], skew=18))
    
    spine_x = 215
    spine_w = 190
    spine_h = 58
    cx = spine_x + spine_w / 2
    
    tabs = [
        ("Review pending", "students?", ["Approve or reject student"]),
        ("Manage student", "accounts?", ["Display student accounts"]),
        ("Review service", "listings?", ["Display service listings"]),
        ("View platform", "transactions?", ["Display transactions"]),
        ("View activity", "logs?", ["Display activity logs"]),
    ]
    
    y = 285
    parts.append(line_arrow(310, 257, 310, y))
    
    right_bus_x = 730
    
    for i, (q1, q2, io_lines) in enumerate(tabs):
        parts.append(decision(spine_x, y, spine_w, spine_h, [q1, q2]))
        # Yes -> right to I/O parallelogram
        parts.append(line_arrow(spine_x + spine_w, y + spine_h/2, 445, y + spine_h/2))
        parts.append(branch_label(425, y + spine_h/2 - 9, "Yes"))
        parts.append(io(445, y + 4, 230, 50, io_lines, skew=18))
        
        # Parallelogram right edge joins right bus
        parts.append(plain_line(660, y + spine_h/2, right_bus_x, y + spine_h/2))
        
        # Next down line
        next_y = y + 80
        parts.append(line_arrow(cx, y + spine_h, cx, next_y))
        parts.append(branch_label(cx + 15, y + spine_h + 13, "No"))
        y = next_y
        
    # Decision 6: Click sign out?
    parts.append(decision(spine_x, y, spine_w, spine_h, ["Click sign out?"]))
    
    # Yes -> Clear session & Connector 1
    parts.append(line_arrow(spine_x + spine_w, y + spine_h/2, 500, y + spine_h/2))
    parts.append(branch_label(430, y + spine_h/2 - 9, "Yes"))
    parts.append(connector_pentagon(500, y + spine_h/2 - 25, 55, 50, "1", direction="right"))
    
    # Right bus connects down into Click sign out?
    parts.append(poly_arrow([(right_bus_x, 314), (right_bus_x, y - 25), (310, y - 25), (310, y)]))
    
    # No -> loops back to top Display parallelogram via left bus
    parts.append(poly_arrow([
        (cx, y + spine_h), (cx, y + spine_h + 40), (80, y + spine_h + 40), (80, 231), (175, 231)
    ]))
    parts.append(branch_label(cx + 15, y + spine_h + 20, "No"))
    
    # Caption and page
    parts.append('<text x="440" y="990" class="text-caption">Fig. 6.1.4. Admin Dashboard</text>')
    parts.append('<text x="770" y="1040" class="page-num">25</text>')
    
    parts.append('</svg>')
    return '\n'.join(parts)

# =========================================================================
# DIAGRAM 5: Fig. 6.1.5. Student Dashboard & Marketplace Hubs
# =========================================================================
def build_diagram_5():
    w, h = 880, 1180
    parts = [SVG_HEADER.format(w=w, h=h)]
    
    # Connector 5 pointing down
    parts.append(connector_pentagon(285, 35, 50, 50, "5", direction="down"))
    parts.append(line_arrow(310, 85, 310, 125))
    
    # Load student data (Process)
    parts.append(process(215, 125, 190, 44, ["Load student data"]))
    parts.append(line_arrow(310, 169, 310, 205))
    
    # Display dashboard (I/O)
    parts.append(io(185, 205, 250, 52, ["Display dashboard"], skew=18))
    
    spine_x = 215
    spine_w = 190
    spine_h = 58
    cx = spine_x + spine_w / 2
    
    # 1. Post or apply to service? (Decision) -> Connector 6
    y = 285
    parts.append(line_arrow(310, 257, 310, y))
    parts.append(decision(spine_x, y, spine_w, spine_h, ["Post or apply", "to service?"]))
    parts.append(line_arrow(spine_x + spine_w, y + spine_h/2, 440, y + spine_h/2))
    parts.append(branch_label(420, y + spine_h/2 - 9, "Yes"))
    parts.append(process(440, y + 6.5, 175, 45, ["Select service listing"]))
    parts.append(line_arrow(615, y + spine_h/2, 670, y + spine_h/2))
    parts.append(connector_pentagon(670, y + spine_h/2 - 25, 55, 50, "6", direction="right"))
    
    # 2. Click service offers? (Decision)
    y2 = y + 80
    parts.append(line_arrow(cx, y + spine_h, cx, y2))
    parts.append(branch_label(cx + 15, y + spine_h + 13, "No"))
    parts.append(decision(spine_x, y2, spine_w, spine_h, ["Click service", "offers?"]))
    parts.append(line_arrow(spine_x + spine_w, y2 + spine_h/2, 440, y2 + spine_h/2))
    parts.append(branch_label(420, y2 + spine_h/2 - 9, "Yes"))
    parts.append(io(440, y2 + 5, 220, 48, ["Display service offers"], skew=18))
    
    # 3. Click service requests? (Decision)
    y3 = y2 + 80
    parts.append(line_arrow(cx, y2 + spine_h, cx, y3))
    parts.append(branch_label(cx + 15, y2 + spine_h + 13, "No"))
    parts.append(decision(spine_x, y3, spine_w, spine_h, ["Click service", "requests?"]))
    parts.append(line_arrow(spine_x + spine_w, y3 + spine_h/2, 440, y3 + spine_h/2))
    parts.append(branch_label(420, y3 + spine_h/2 - 9, "Yes"))
    parts.append(io(440, y3 + 5, 220, 48, ["Display service requests"], skew=18))
    
    # 4. Click applications? (Decision)
    y4 = y3 + 80
    parts.append(line_arrow(cx, y3 + spine_h, cx, y4))
    parts.append(branch_label(cx + 15, y3 + spine_h + 13, "No"))
    parts.append(decision(spine_x, y4, spine_w, spine_h, ["Click applications?"]))
    parts.append(line_arrow(spine_x + spine_w, y4 + spine_h/2, 440, y4 + spine_h/2))
    parts.append(branch_label(420, y4 + spine_h/2 - 9, "Yes"))
    parts.append(io(440, y4 + 5, 220, 48, ["Display applications"], skew=18))
    
    # 5. Click messages? (Decision)
    y5 = y4 + 80
    parts.append(line_arrow(cx, y4 + spine_h, cx, y5))
    parts.append(branch_label(cx + 15, y4 + spine_h + 13, "No"))
    parts.append(decision(spine_x, y5, spine_w, spine_h, ["Click messages?"]))
    parts.append(line_arrow(spine_x + spine_w, y5 + spine_h/2, 440, y5 + spine_h/2))
    parts.append(branch_label(420, y5 + spine_h/2 - 9, "Yes"))
    parts.append(io(440, y5 + 5, 220, 48, ["Display messages"], skew=18))
    
    # 6. Click profile settings? (Decision)
    y6 = y5 + 80
    parts.append(line_arrow(cx, y5 + spine_h, cx, y6))
    parts.append(branch_label(cx + 15, y5 + spine_h + 13, "No"))
    parts.append(decision(spine_x, y6, spine_w, spine_h, ["Click profile", "settings?"]))
    parts.append(line_arrow(spine_x + spine_w, y6 + spine_h/2, 440, y6 + spine_h/2))
    parts.append(branch_label(420, y6 + spine_h/2 - 9, "Yes"))
    
    # Input updated profile (I/O)
    parts.append(io(440, y6 - 5, 205, 58, ["Enter profile updates"], skew=16))
    
    # Are inputs valid? (Decision)
    parts.append(line_arrow(630, y6 + 24, 675, y6 + 24))
    parts.append(decision(675, y6 - 6, 140, 60, ["Details valid?"]))
    
    # No -> retry loop (routed cleanly below Enter profile updates)
    parts.append(poly_arrow([(815, y6 + 24), (840, y6 + 24), (840, y6 + 72), (542, y6 + 72), (542, y6 + 53)]))
    parts.append(branch_label(825, y6 + 14, "No"))
    
    # Yes -> Save profile updates (Process)
    parts.append(line_arrow(745, y6 + 54, 745, y6 + 90))
    parts.append(branch_label(760, y6 + 72, "Yes"))
    parts.append(process(655, y6 + 90, 180, 45, ["Save profile updates"]))
    parts.append(poly_arrow([(655, y6 + 112.5), (80, y6 + 112.5), (80, 231), (185, 231)]))
    
    # 7. Click sign out? (Decision)
    y7 = y6 + 120
    parts.append(line_arrow(cx, y6 + spine_h, cx, y7))
    parts.append(branch_label(cx + 15, y6 + spine_h + 13, "No"))
    parts.append(decision(spine_x, y7, spine_w, spine_h, ["Click sign out?"]))
    
    # Yes -> Clear session & Connector 1
    parts.append(line_arrow(spine_x + spine_w, y7 + spine_h/2, 450, y7 + spine_h/2))
    parts.append(branch_label(425, y7 + spine_h/2 - 9, "Yes"))
    parts.append(connector_pentagon(450, y7 + spine_h/2 - 25, 55, 50, "1", direction="right"))
    
    # No -> loops back to top Display parallelogram via left bus
    parts.append(poly_arrow([
        (cx, y7 + spine_h), (cx, y7 + spine_h + 35), (80, y7 + spine_h + 35), (80, 231), (185, 231)
    ]))
    parts.append(branch_label(cx + 15, y7 + spine_h + 15, "No"))
    
    # Caption and page
    parts.append('<text x="440" y="1030" class="text-caption">Fig. 6.1.5. Student Dashboard &amp; Marketplace Hubs</text>')
    parts.append('<text x="770" y="1080" class="page-num">26</text>')
    
    parts.append('</svg>')
    return '\n'.join(parts)

# =========================================================================
# DIAGRAM 6: Fig. 6.1.6. Service Engagement, Ordering & Transaction Workflow
# =========================================================================
def build_diagram_6():
    w, h = 880, 1180
    parts = [SVG_HEADER.format(w=w, h=h)]
    
    # Connector 6 pointing down
    parts.append(connector_pentagon(285, 35, 50, 50, "6", direction="down"))
    parts.append(line_arrow(310, 85, 310, 125))
    
    # Display service listings (I/O)
    parts.append(io(200, 125, 220, 50, ["Display service listings"], skew=18))
    
    # Post service request? (Decision)
    parts.append(line_arrow(310, 175, 310, 215))
    parts.append(decision(205, 215, 210, 60, ["Post service request?"]))
    
    # ================== YES BRANCH: Post New Request ==================
    parts.append(line_arrow(415, 245, 475, 245))
    parts.append(branch_label(445, 235, "Yes"))
    
    # Enter details (I/O)
    parts.append(io(475, 220, 200, 50, ["Enter details"], skew=18))
    
    # Validate details (Process)
    parts.append(line_arrow(575, 270, 575, 310))
    parts.append(process(485, 310, 180, 44, ["Validate details"]))
    
    # Details valid? (Decision)
    parts.append(line_arrow(575, 354, 575, 395))
    parts.append(decision(485, 395, 180, 60, ["Details valid?"]))
    
    # No -> retry loop
    parts.append(poly_arrow([(665, 425), (705, 425), (705, 245), (660, 245)]))
    parts.append(branch_label(685, 415, "No"))
    
    # Yes -> Post service request (Process)
    parts.append(line_arrow(575, 455, 575, 500))
    parts.append(branch_label(590, 475, "Yes"))
    parts.append(process(480, 500, 190, 45, ["Post service request"]))
    
    # Submit -> Connector 5
    parts.append(line_arrow(670, 522.5, 735, 522.5))
    parts.append(connector_pentagon(735, 500, 55, 45, "5", direction="right"))
    
    # ================== NO BRANCH: Apply to Existing Service ==================
    parts.append(line_arrow(310, 275, 310, 315))
    parts.append(branch_label(325, 295, "No"))
    
    # Enter proposal and price (I/O)
    parts.append(io(190, 315, 240, 52, ["Enter proposal and price"], skew=18))
    
    # Submit application (Process)
    parts.append(line_arrow(310, 367, 310, 410))
    parts.append(process(215, 410, 190, 45, ["Submit application"]))
    
    # Poster reviews applicant (I/O)
    parts.append(line_arrow(310, 455, 310, 495))
    parts.append(io(195, 495, 230, 48, ["Poster reviews applicant"], skew=18))
    
    # Approve applicant? (Decision)
    parts.append(line_arrow(310, 543, 310, 580))
    parts.append(decision(210, 580, 200, 60, ["Approve applicant?"]))
    
    # Approve No -> loops back
    parts.append(poly_arrow([(410, 610), (440, 610), (440, 519), (410, 519)]))
    parts.append(branch_label(425, 600, "No"))
    
    # Approve Yes -> Create chat conversation (Process)
    parts.append(line_arrow(310, 640, 310, 680))
    parts.append(branch_label(325, 660, "Yes"))
    parts.append(process(215, 680, 190, 45, ["Open chat conversation"]))
    
    # Message and reach an agreement (I/O)
    parts.append(line_arrow(310, 725, 310, 765))
    parts.append(io(175, 765, 270, 50, ["Message and reach an agreement"], skew=18))
    
    # Click complete? (Decision)
    parts.append(line_arrow(310, 815, 310, 855))
    parts.append(decision(210, 855, 200, 62, ["Click complete?"]))
    
    # ================== COMPLETE YES BRANCH ==================
    # Update status to complete (Process)
    parts.append(line_arrow(310, 917, 310, 955))
    parts.append(branch_label(325, 935, "Yes"))
    parts.append(process(200, 955, 220, 45, ["Update status to complete"]))
    
    # Fill rating and feedback (I/O)
    parts.append(line_arrow(310, 1000, 310, 1035))
    parts.append(io(190, 1035, 240, 48, ["Fill rating and feedback"], skew=18))
    
    # Save rating (Process)
    parts.append(line_arrow(415, 1059, 475, 1059))
    parts.append(process(475, 1036.5, 140, 45, ["Save rating"]))
    
    # Connector 5 (Student Dashboard)
    parts.append(line_arrow(615, 1059, 675, 1059))
    parts.append(connector_pentagon(675, 1036.5, 55, 45, "5", direction="right"))
    
    # ================== COMPLETE NO BRANCH: Terminate? ==================
    parts.append(line_arrow(410, 886, 480, 886))
    parts.append(branch_label(445, 876, "No"))
    parts.append(decision(480, 855, 180, 62, ["Terminate?"]))
    
    # Terminate No -> loops back to chat
    parts.append(poly_arrow([(570, 855), (570, 790), (430, 790)]))
    parts.append(branch_label(585, 825, "No"))
    
    # Terminate Yes -> Update status to terminated (Process)
    parts.append(line_arrow(660, 886, 715, 886))
    parts.append(branch_label(688, 876, "Yes"))
    parts.append(process(715, 863.5, 140, 45, ["Update status to", "terminated"]))
    
    # Terminated -> Connector 5 pointing down to Student Dashboard
    parts.append(line_arrow(785, 908.5, 785, 955))
    parts.append(connector_pentagon(760, 955, 50, 45, "5", direction="down"))
    
    # Caption and page
    parts.append('<text x="440" y="1120" class="text-caption">Fig. 6.1.6. Service Engagement, Ordering &amp; Transaction Workflow</text>')
    parts.append('<text x="770" y="1150" class="page-num">27</text>')
    
    parts.append('</svg>')
    return '\n'.join(parts)

# =========================================================================
# Playwright Renderer: 6 Crisp PNGs + Unified Multi-Page PDF
# =========================================================================
async def render_all():
    diagrams = [
        ("flowchart_1_landing_page.png", build_diagram_1()),
        ("flowchart_2_login_registration.png", build_diagram_2()),
        ("flowchart_3_role_router.png", build_diagram_3()),
        ("flowchart_4_admin_dashboard.png", build_diagram_4()),
        ("flowchart_5_student_dashboard.png", build_diagram_5()),
        ("flowchart_6_service_engagement.png", build_diagram_6()),
    ]
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel="msedge")
        page = await browser.new_page(device_scale_factor=2)
        
        # 1. Render individual PNGs
        for filename, svg_content in diagrams:
            out_png = os.path.join(OUT_DIR, filename)
            html = f'''<!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body {{ margin: 0; padding: 0; background: #ffffff; display: flex; justify-content: center; }}
              </style>
            </head>
            <body>
              {svg_content}
            </body>
            </html>
            '''
            await page.set_content(html)
            svg_elem = await page.query_selector('svg')
            if svg_elem:
                await svg_elem.screenshot(path=out_png)
                print(f"[PNG OK] Rendered: {out_png}")
            else:
                await page.screenshot(path=out_png, full_page=True)
                print(f"[Fallback PNG OK] Rendered: {out_png}")
        
        # 2. Render all into a unified multi-page PDF
        pdf_pages_html = []
        for _, svg_content in diagrams:
            pdf_pages_html.append(f'<div class="page-container">{svg_content}</div>')
            
        full_pdf_html = f'''<!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            @page {{
              size: A4 portrait;
              margin: 0;
            }}
            * {{
              box-sizing: border-box;
            }}
            body {{
              margin: 0;
              padding: 0;
              background: #ffffff;
            }}
            .page-container {{
              width: 210mm;
              height: 297mm;
              page-break-after: always;
              display: flex;
              justify-content: center;
              align-items: center;
              padding: 10mm;
              background: #ffffff;
            }}
            .page-container:last-child {{
              page-break-after: avoid;
            }}
            svg {{
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
            }}
          </style>
        </head>
        <body>
          {''.join(pdf_pages_html)}
        </body>
        </html>
        '''
        
        out_pdf_brain = os.path.join(OUT_DIR, "flowcharts_documentation.pdf")
        out_pdf_project = os.path.join(PROJECT_DIR, "flowcharts_documentation.pdf")
        out_pdf_alt = os.path.join(PROJECT_DIR, "Work4ABit_System_Flowcharts.pdf")
        
        await page.set_content(full_pdf_html)
        await page.wait_for_timeout(1000)
        await page.pdf(
            path=out_pdf_brain,
            format="A4",
            print_background=True,
            margin={"top": "0", "bottom": "0", "left": "0", "right": "0"}
        )
        print(f"[PDF OK] Generated Brain PDF: {out_pdf_brain}")
        
        # Try copying to primary project root path
        try:
            shutil.copyfile(out_pdf_brain, out_pdf_project)
            print(f"[PDF OK] Copied to Project root: {out_pdf_project}")
        except PermissionError:
            print(f"[NOTICE] {out_pdf_project} is currently locked by another viewer.")
            shutil.copyfile(out_pdf_brain, out_pdf_alt)
            print(f"[PDF OK] Saved unlocked copy to: {out_pdf_alt}")
            
        await browser.close()
    print("All Work4ABit flowcharts successfully rendered with simplified wording and compiled into PDF!")

if __name__ == "__main__":
    asyncio.run(render_all())
