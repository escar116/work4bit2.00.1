import os
import asyncio
from playwright.async_api import async_playwright

OUT_DIR = r"C:/Users/charles/.gemini/antigravity/brain/2dcbce95-d155-4f78-82c5-cabf4dd81ced"
os.makedirs(OUT_DIR, exist_ok=True)

# High-contrast, sharp academic styling
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
    .text-branch {{ font-size: 13px; font-weight: bold; fill: #111827; text-anchor: middle; }}
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
    cx = x + w / 2
    cy = y + h / 2
    return f'''
    <rect x="{x}" y="{y}" width="{w}" height="{h}" class="shape" filter="url(#subtle-shadow)" />
    {wrap_text(lines, cx, cy)}
    '''

def io(x, y, w, h, lines, skew=18):
    cx = x + w / 2
    cy = y + h / 2
    pts = f"{x+skew},{y} {x+w},{y} {x+w-skew},{y+h} {x},{y+h}"
    return f'''
    <polygon points="{pts}" class="shape" filter="url(#subtle-shadow)" />
    {wrap_text(lines, cx, cy)}
    '''

def decision(x, y, w, h, lines):
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
# DIAGRAM 1: Fig. 6.1.1. Landing Page
# =========================================================================
def build_diagram_1():
    w, h = 800, 1140
    parts = [SVG_HEADER.format(w=w, h=h)]
    
    parts.append('<text x="80" y="70" class="text-title">FLOWCHART</text>')
    
    # Center X = 400
    # START terminal
    parts.append(oval(345, 90, 110, 40, "START"))
    parts.append(line_arrow(400, 130, 400, 165))
    
    # Display Landing Page (I/O)
    parts.append(io(300, 165, 200, 52, ["Display Landing", "Page"], skew=18))
    
    # Connector 1 pointing left
    parts.append(connector_pentagon(560, 169, 58, 44, "1", direction="left"))
    parts.append(line_arrow(560, 191, 490, 191))
    
    # Check user session (Process)
    parts.append(line_arrow(400, 217, 400, 252))
    parts.append(process(295, 252, 210, 44, ["Check user session"]))
    
    # Clicked login/register? (Decision)
    parts.append(line_arrow(400, 296, 400, 332))
    parts.append(decision(295, 332, 210, 62, ["Clicked", "login/register?"]))
    parts.append(line_arrow(505, 363, 560, 363))
    parts.append(branch_label(532, 353, "Yes"))
    parts.append(connector_pentagon(560, 341, 60, 44, "2", direction="right"))
    parts.append(line_arrow(400, 394, 400, 430))
    parts.append(branch_label(385, 412, "No"))
    
    # Clicked book an appointment? (Decision)
    parts.append(decision(295, 430, 210, 62, ["Clicked book an", "appointment?"]))
    parts.append(line_arrow(505, 461, 560, 461))
    parts.append(branch_label(532, 451, "Yes"))
    parts.append(connector_pentagon(560, 439, 60, 44, "6", direction="right"))
    
    # No -> branches down-left to Clicked menu bar?
    parts.append(poly_arrow([(400, 492), (400, 510), (225, 510), (225, 535)]))
    parts.append(branch_label(295, 502, "No"))
    
    # Clicked menu bar? (Decision)
    parts.append(decision(140, 535, 170, 58, ["Clicked menu bar?"]))
    parts.append(line_arrow(310, 564, 370, 564))
    parts.append(branch_label(340, 554, "Yes"))
    
    # Clicked about us? (Decision)
    parts.append(decision(370, 535, 170, 58, ["Clicked about us?"]))
    # Yes -> enters top of Display About Us page
    parts.append(poly_arrow([(540, 564), (610, 564), (610, 605)]))
    parts.append(branch_label(570, 554, "Yes"))
    
    # Display About Us page (I/O)
    parts.append(io(515, 605, 190, 48, ["Display About Us", "page"], skew=18))
    
    # About Us -> Clicked back button?
    parts.append(line_arrow(610, 653, 610, 690))
    
    # Clicked Our Services? (from Clicked menu bar No)
    parts.append(line_arrow(225, 593, 225, 625))
    parts.append(branch_label(242, 609, "No"))
    parts.append(decision(140, 625, 170, 58, ["Clicked Our", "Services?"]))
    
    # Clicked Our Services? Yes -> enters top of Display Services section
    parts.append(poly_arrow([(310, 654), (385, 654), (385, 680)]))
    parts.append(branch_label(335, 644, "Yes"))
    
    # Display Services section (I/O)
    parts.append(io(295, 680, 180, 48, ["Display Services", "section"], skew=18))
    
    # Display Services right edge -> Clicked back button left point (labeled Yes in ref)
    parts.append(line_arrow(465, 704, 525, 717))
    parts.append(branch_label(495, 700, "Yes"))
    
    # Clicked back button? (Decision)
    parts.append(decision(525, 690, 170, 54, ["Clicked back", "button?"]))
    
    # Clicked back button? No -> loops back into right edge of Display About Us page
    parts.append(poly_arrow([(695, 717), (725, 717), (725, 629), (695, 629)]))
    parts.append(branch_label(712, 707, "No"))
    
    # Clicked back button? Bottom point No -> loops to bottom of Display Services section
    parts.append(poly_arrow([(610, 744), (610, 770), (385, 770), (385, 728)]))
    parts.append(branch_label(525, 760, "No"))
    
    # Clicked back button? Yes (from lower right) -> enters Clicked exit button
    parts.append(poly_arrow([(660, 730), (660, 797), (605, 797)]))
    parts.append(branch_label(680, 760, "Yes"))
    
    # Clicked exit button? (Decision)
    parts.append(decision(445, 770, 160, 54, ["Clicked exit", "button?"]))
    
    # Clicked exit button? Yes -> FINISH
    parts.append(line_arrow(445, 797, 375, 797))
    parts.append(branch_label(410, 787, "Yes"))
    parts.append(oval(275, 777, 100, 40, "FINISH"))
    
    # Clicked Our Services? No -> connects cleanly to left bus at (75, 715)
    parts.append(poly_line([(225, 683), (225, 715), (75, 715)]))
    parts.append(branch_label(210, 705, "No"))
    
    # Clicked exit button? No -> loops all the way back to Display Landing Page via left bus
    parts.append(poly_arrow([
        (525, 824), (525, 870), (75, 870), (75, 191), (310, 191)
    ]))
    parts.append(branch_label(510, 845, "No"))
    
    # Caption and page
    parts.append('<text x="400" y="960" class="text-caption">Fig. 6.1.1. Landing Page</text>')
    parts.append('<text x="730" y="1010" class="page-num">22</text>')
    
    parts.append('</svg>')
    return '\n'.join(parts)

# =========================================================================
# DIAGRAM 2: Fig. 6.1.2. Patient & Admin Login
# =========================================================================
def build_diagram_2():
    w, h = 800, 1100
    parts = [SVG_HEADER.format(w=w, h=h)]
    
    # Connector 2 pointing down at top
    parts.append(connector_pentagon(235, 55, 50, 50, "2", direction="down"))
    parts.append(line_arrow(260, 105, 260, 150))
    
    # Display login page (I/O)
    parts.append(io(175, 150, 170, 50, ["Display login", "page"], skew=18))
    
    # On-page connector A pointing into right side of Display login page
    parts.append(connector_circle(395, 175, 18, "A"))
    parts.append(line_arrow(377, 175, 335, 175))
    
    # Clicked Signup? (Decision)
    parts.append(line_arrow(260, 200, 260, 245))
    parts.append(decision(175, 245, 170, 60, ["Clicked", "Signup?"]))
    
    # Yes -> Create username and password (I/O)
    parts.append(line_arrow(345, 275, 385, 275))
    parts.append(branch_label(365, 265, "Yes"))
    parts.append(io(385, 250, 190, 50, ["Create username and", "password"], skew=18))
    
    # User submit (Process)
    parts.append(line_arrow(565, 275, 605, 275))
    parts.append(process(605, 252.5, 115, 45, ["User submit"]))
    
    # Username available? (Decision)
    parts.append(line_arrow(662.5, 297.5, 662.5, 340))
    parts.append(decision(582.5, 340, 160, 60, ["Username", "available?"]))
    
    # Retry loop back into Create username and password
    parts.append(poly_arrow([(742.5, 370), (765, 370), (765, 215), (480, 215), (480, 250)]))
    parts.append(branch_label(755, 360, "No"))
    
    # Yes -> Password valid? (Decision)
    parts.append(line_arrow(662.5, 400, 662.5, 445))
    parts.append(branch_label(680, 425, "Yes"))
    parts.append(decision(582.5, 445, 160, 60, ["Password", "valid?"]))
    
    # Password valid? No -> joins retry loop
    parts.append(plain_line(742.5, 475, 765, 475))
    parts.append(branch_label(755, 465, "No"))
    
    # Yes -> Create user account (Process)
    parts.append(line_arrow(582.5, 475, 525, 475))
    parts.append(branch_label(555, 465, "Yes"))
    parts.append(process(340, 452.5, 185, 45, ["Create user account", "(NULL patient details)"]))
    
    # Account created -> Connector A (on-page)
    parts.append(line_arrow(432.5, 497.5, 432.5, 540))
    parts.append(connector_circle(432.5, 558, 18, "A"))
    
    # Clicked Signup? No -> Clicked Login? (Decision)
    parts.append(line_arrow(260, 305, 260, 595))
    parts.append(branch_label(275, 335, "No"))
    parts.append(decision(175, 595, 170, 60, ["Clicked", "Login?"]))
    
    # Yes -> Enter credentials (I/O)
    parts.append(line_arrow(345, 625, 385, 625))
    parts.append(branch_label(365, 615, "Yes"))
    parts.append(io(385, 600, 155, 50, ["Enter", "credentials"], skew=18))
    
    # Valid Credentials? (Decision)
    parts.append(line_arrow(530, 625, 580, 625))
    parts.append(decision(580, 595, 160, 60, ["Valid", "Credentials?"]))
    
    # Valid? Yes -> Connector 3
    parts.append(poly_arrow([(740, 625), (760, 625), (760, 695)]))
    parts.append(branch_label(750, 615, "Yes"))
    parts.append(connector_pentagon(735, 695, 50, 50, "3", direction="down"))
    
    # Valid? No -> Connector A
    parts.append(poly_arrow([(660, 655), (660, 705), (550, 705)]))
    parts.append(branch_label(640, 680, "No"))
    parts.append(connector_circle(532, 705, 18, "A"))
    
    # Clicked Login? No -> loop back to Display login page
    parts.append(poly_arrow([(175, 625), (135, 625), (135, 175), (185, 175)]))
    parts.append(branch_label(155, 615, "No"))
    
    # Caption and page
    parts.append('<text x="400" y="850" class="text-caption">Fig. 6.1.2 Patient &amp; Admin Login</text>')
    parts.append('<text x="730" y="900" class="page-num">23</text>')
    
    parts.append('</svg>')
    return '\n'.join(parts)

# =========================================================================
# DIAGRAM 3: Fig. 6.1.3. Admin and Patient Dashboard
# =========================================================================
def build_diagram_3():
    w, h = 800, 800
    parts = [SVG_HEADER.format(w=w, h=h)]
    
    # Connector 3 pointing down at top
    parts.append(connector_pentagon(375, 75, 50, 50, "3", direction="down"))
    parts.append(line_arrow(400, 125, 400, 175))
    
    # Is the user an admin? (Decision)
    parts.append(decision(315, 175, 170, 65, ["Is the user an", "admin?"]))
    
    # Yes (Left) -> Admin dashboard (I/O)
    parts.append(line_arrow(315, 207.5, 245, 207.5))
    parts.append(branch_label(280, 197, "Yes"))
    parts.append(io(85, 180, 170, 55, ["Admin", "dashboard"], skew=18))
    
    # Load admin data (Process)
    parts.append(line_arrow(170, 235, 170, 305))
    parts.append(process(85, 305, 170, 45, ["Load admin data"]))
    
    # Connector 4 pointing down
    parts.append(line_arrow(170, 350, 170, 410))
    parts.append(connector_pentagon(145, 410, 50, 50, "4", direction="down"))
    
    # No (Right) -> Patient dashboard (I/O)
    parts.append(line_arrow(485, 207.5, 555, 207.5))
    parts.append(branch_label(520, 197, "No"))
    parts.append(io(545, 180, 170, 55, ["Patient", "dashboard"], skew=18))
    
    # Load patient data (Process)
    parts.append(line_arrow(630, 235, 630, 305))
    parts.append(process(545, 305, 170, 45, ["Load patient data"]))
    
    # Connector 5 pointing down
    parts.append(line_arrow(630, 350, 630, 410))
    parts.append(connector_pentagon(605, 410, 50, 50, "5", direction="down"))
    
    # Caption and page
    parts.append('<text x="400" y="580" class="text-caption">Fig. 6.1.3 Admin and Patient Dashboard</text>')
    parts.append('<text x="730" y="630" class="page-num">24</text>')
    
    parts.append('</svg>')
    return '\n'.join(parts)

# =========================================================================
# DIAGRAM 4: Fig. 6.1.4. Admin Dashboard
# =========================================================================
def build_diagram_4():
    w, h = 850, 1150
    parts = [SVG_HEADER.format(w=w, h=h)]
    
    # Connector 4 pointing down
    parts.append(connector_pentagon(285, 40, 50, 50, "4", direction="down"))
    parts.append(line_arrow(310, 90, 310, 130))
    
    # Load dashboard statistics (Process)
    parts.append(process(220, 130, 180, 45, ["Load dashboard statistics"]))
    parts.append(line_arrow(310, 175, 310, 210))
    
    # Display today's appointments, total patients... (I/O)
    parts.append(io(120, 210, 380, 50, [
        "Display today's appointments, total patients,",
        "pending appointments, monthly revenue"
    ], skew=20))
    
    spine_x = 225
    spine_w = 170
    spine_h = 58
    cx = spine_x + spine_w / 2
    
    tabs = [
        ("Clicked", "appointment tab?", ["Display appointment", "management system"]),
        ("Clicked", "patients tab?", ["Display patient", "management system"]),
        ("Clicked", "treatments tab?", ["Display treatments", "management system"]),
        ("Clicked", "schedule tab?", ["Display schedule", "management system"]),
        ("Clicked reports", "tab?", ["Display reports", "management system"]),
        ("Clicked settings", "tab?", ["Display settings", "management system"]),
    ]
    
    y = 285
    parts.append(line_arrow(310, 260, 310, y))
    
    right_bus_x = 690
    
    for i, (q1, q2, io_lines) in enumerate(tabs):
        parts.append(decision(spine_x, y, spine_w, spine_h, [q1, q2]))
        # Yes -> right to I/O parallelogram
        parts.append(line_arrow(spine_x + spine_w, y + spine_h/2, 430, y + spine_h/2))
        parts.append(branch_label(412, y + spine_h/2 - 9, "Yes"))
        parts.append(io(425, y + 5, 210, 48, io_lines, skew=18))
        
        # Parallelogram right edge joins right bus
        parts.append(plain_line(625, y + spine_h/2, right_bus_x, y + spine_h/2))
        
        # Next down line
        next_y = y + 80
        parts.append(line_arrow(cx, y + spine_h, cx, next_y))
        parts.append(branch_label(cx + 15, y + spine_h + 13, "No"))
        y = next_y
        
    # Decision 7: Clicked dashboard tab?
    parts.append(decision(spine_x, y, spine_w, spine_h, ["Clicked", "dashboard tab?"]))
    # Yes -> loop back to top Display parallelogram via left bus
    parts.append(poly_arrow([(spine_x, y + spine_h/2), (85, y + spine_h/2), (85, 235), (130, 235)]))
    parts.append(branch_label(spine_x - 18, y + spine_h/2 - 9, "Yes"))
    
    # No -> right towards Clicked logout button?
    parts.append(line_arrow(spine_x + spine_w, y + spine_h/2, 530, y + spine_h/2))
    parts.append(branch_label(440, y + spine_h/2 - 9, "No"))
    
    # Right bus from all IO parallelograms connects down into Clicked logout button
    parts.append(poly_arrow([(right_bus_x, 314), (right_bus_x, y - 25), (610, y - 25), (610, y)]))
    
    # Clicked logout button? (Decision)
    parts.append(decision(530, y, 160, spine_h, ["Clicked logout", "button?"]))
    
    # Yes -> Connector 1
    parts.append(line_arrow(690, y + spine_h/2, 740, y + spine_h/2))
    parts.append(branch_label(715, y + spine_h/2 - 9, "Yes"))
    parts.append(connector_pentagon(740, y + spine_h/2 - 25, 55, 50, "1", direction="right"))
    
    # No -> loops all the way back to top Display parallelogram via left bus
    parts.append(poly_arrow([
        (610, y + spine_h), (610, y + spine_h + 40), (85, y + spine_h + 40), (85, 235)
    ]))
    parts.append(branch_label(625, y + spine_h + 20, "No"))
    
    # Caption and page
    parts.append('<text x="425" y="960" class="text-caption">Fig. 6.1.4 Admin Dashboard</text>')
    parts.append('<text x="740" y="1010" class="page-num">25</text>')
    
    parts.append('</svg>')
    return '\n'.join(parts)

# =========================================================================
# DIAGRAM 5: Fig. 6.1.5. Patient Dashboard
# =========================================================================
def build_diagram_5():
    w, h = 850, 1100
    parts = [SVG_HEADER.format(w=w, h=h)]
    
    # Connector 5 pointing down
    parts.append(connector_pentagon(285, 40, 50, 50, "5", direction="down"))
    parts.append(line_arrow(310, 90, 310, 130))
    
    # Get patient id from session (Process)
    parts.append(process(215, 130, 190, 45, ["Get patient id from session"]))
    parts.append(line_arrow(310, 175, 310, 210))
    
    # Display patient data, appointment history... (I/O)
    parts.append(io(120, 210, 380, 50, [
        "Display patient data, appointment history,",
        "upcoming appointments"
    ], skew=20))
    
    spine_x = 225
    spine_w = 170
    spine_h = 58
    cx = spine_x + spine_w / 2
    
    # 1. Clicked book appointment? (Decision) -> Fetch patient data (Process) -> Connector 6
    y = 285
    parts.append(line_arrow(310, 260, 310, y))
    parts.append(decision(spine_x, y, spine_w, spine_h, ["Clicked book", "appointment?"]))
    parts.append(line_arrow(spine_x + spine_w, y + spine_h/2, 440, y + spine_h/2))
    parts.append(branch_label(415, y + spine_h/2 - 9, "Yes"))
    parts.append(process(440, y + 6.5, 160, 45, ["Fetch patient data"]))
    parts.append(line_arrow(600, y + spine_h/2, 655, y + spine_h/2))
    parts.append(connector_pentagon(655, y + spine_h/2 - 25, 55, 50, "6", direction="right"))
    
    # 2. Clicked print medical certificate? (Decision)
    y2 = y + 80
    parts.append(line_arrow(cx, y + spine_h, cx, y2))
    parts.append(branch_label(cx + 15, y + spine_h + 13, "No"))
    parts.append(decision(spine_x, y2 - 4, spine_w, 66, ["Clicked print", "medical", "certificate?"]))
    parts.append(line_arrow(spine_x + spine_w, y2 + 29, 440, y2 + 29))
    parts.append(branch_label(415, y2 + 20, "Yes"))
    parts.append(io(435, y2 + 5, 200, 48, ["Display medical", "certificate"], skew=18))
    
    # 3. Clicked pint receipt? (Decision)
    y3 = y2 + 80
    parts.append(line_arrow(cx, y2 + spine_h, cx, y3))
    parts.append(branch_label(cx + 15, y2 + spine_h + 13, "No"))
    parts.append(decision(spine_x, y3, spine_w, spine_h, ["Clicked pint", "receipt?"]))
    parts.append(line_arrow(spine_x + spine_w, y3 + spine_h/2, 440, y3 + spine_h/2))
    parts.append(branch_label(415, y3 + spine_h/2 - 9, "Yes"))
    parts.append(io(435, y3 + 5, 200, 48, ["Display medical receipt"], skew=18))
    
    # 4. Clicked change password? (Decision)
    y4 = y3 + 105
    parts.append(line_arrow(cx, y3 + spine_h, cx, y4))
    parts.append(branch_label(cx + 15, y3 + spine_h + 15, "No"))
    parts.append(decision(spine_x, y4, spine_w, spine_h, ["Clicked change", "password?"]))
    parts.append(line_arrow(spine_x + spine_w, y4 + spine_h/2, 435, y4 + spine_h/2))
    parts.append(branch_label(415, y4 + spine_h/2 - 9, "Yes"))
    
    # Enter current password, new password and confirm password (I/O)
    parts.append(io(430, y4 - 5, 205, 58, [
        "Enter current password,",
        "new password and confirm",
        "password"
    ], skew=16))
    
    # Are passwords valid? (Decision)
    parts.append(line_arrow(625, y4 + spine_h/2 - 5, 665, y4 + spine_h/2 - 5))
    parts.append(decision(665, y4 - 15, 140, 60, ["Are passwords", "valid?"]))
    
    # No -> retry loop back into Enter password I/O
    parts.append(poly_arrow([(805, y4 + 15), (825, y4 + 15), (825, y4 - 30), (540, y4 - 30), (540, y4 - 5)]))
    parts.append(branch_label(815, y4 + 5, "No"))
    
    # Yes -> Change user password (Process)
    parts.append(line_arrow(735, y4 + 45, 735, y4 + 95))
    parts.append(branch_label(750, y4 + 65, "Yes"))
    parts.append(process(650, y4 + 95, 170, 45, ["Change user password"]))
    # Loops to left bus
    parts.append(poly_arrow([(650, y4 + 117.5), (85, y4 + 117.5), (85, 235), (130, 235)]))
    
    # 5. Clicked logout button?
    y5 = y4 + 125
    parts.append(line_arrow(cx, y4 + spine_h, cx, y5))
    parts.append(branch_label(cx + 15, y4 + spine_h + 15, "No"))
    parts.append(decision(spine_x, y5, spine_w, spine_h, ["Clicked logout", "button?"]))
    
    # Yes -> Connector 1
    parts.append(line_arrow(spine_x + spine_w, y5 + spine_h/2, 450, y5 + spine_h/2))
    parts.append(branch_label(425, y5 + spine_h/2 - 9, "Yes"))
    parts.append(connector_pentagon(450, y5 + spine_h/2 - 25, 55, 50, "1", direction="right"))
    
    # No -> loops back to top Display parallelogram via left bus
    parts.append(poly_arrow([
        (cx, y5 + spine_h), (cx, y5 + spine_h + 35), (85, y5 + spine_h + 35), (85, 235), (130, 235)
    ]))
    parts.append(branch_label(cx + 15, y5 + spine_h + 15, "No"))
    
    # Caption and page
    parts.append('<text x="425" y="970" class="text-caption">Fig. 6.1.5 Patient Dashboard</text>')
    parts.append('<text x="740" y="1020" class="page-num">26</text>')
    
    parts.append('</svg>')
    return '\n'.join(parts)

# =========================================================================
# DIAGRAM 6: Fig. 6.1.5. Patient Appointment (Reference 6.1.5)
# =========================================================================
def build_diagram_6():
    w, h = 850, 1100
    parts = [SVG_HEADER.format(w=w, h=h)]
    
    # Connector 6 pointing down
    parts.append(connector_pentagon(285, 40, 50, 50, "6", direction="down"))
    parts.append(line_arrow(310, 90, 310, 130))
    
    # Enter appointment date and time (I/O)
    parts.append(io(200, 130, 220, 50, [
        "Enter appointment date",
        "and time"
    ], skew=18))
    
    # Date and time slot available? (Decision)
    parts.append(line_arrow(310, 180, 310, 220))
    parts.append(decision(215, 220, 190, 58, ["Date and time slot", "available?"]))
    parts.append(poly_arrow([(405, 249), (435, 249), (435, 155), (410, 155)]))
    parts.append(branch_label(420, 239, "No"))
    
    # Yes -> Patient data available from session? (Decision)
    parts.append(line_arrow(310, 278, 310, 315))
    parts.append(branch_label(325, 296, "Yes"))
    parts.append(decision(215, 315, 190, 68, [
        "Patient data",
        "available from",
        "session?"
    ]))
    
    # Yes (Right) -> Prefill form with existing patient data (Process)
    parts.append(line_arrow(405, 349, 465, 349))
    parts.append(branch_label(435, 339, "Yes"))
    parts.append(process(465, 326.5, 185, 45, [
        "Prefill form with existing",
        "patient data"
    ]))
    parts.append(line_arrow(557.5, 371.5, 557.5, 415))
    parts.append(io(465, 415, 195, 50, [
        "Display form with",
        "prefilled data"
    ], skew=18))
    
    # No (Down) -> Display a blank form (I/O)
    parts.append(line_arrow(310, 383, 310, 415))
    parts.append(branch_label(325, 398, "No"))
    parts.append(io(215, 415, 190, 50, ["Display a blank form"], skew=18))
    
    # Submit button clicked? (Decision)
    parts.append(poly_arrow([(310, 465), (310, 490), (400, 490), (400, 510)]))
    parts.append(poly_line([(557.5, 465), (557.5, 490), (400, 490)]))
    
    parts.append(decision(305, 510, 190, 58, ["Submit button", "clicked?"]))
    parts.append(poly_arrow([(305, 539), (165, 539), (165, 440), (225, 440)]))
    parts.append(branch_label(280, 530, "No"))
    
    # Yes -> Filled all required fields? (Decision)
    parts.append(line_arrow(400, 568, 400, 610))
    parts.append(branch_label(415, 588, "Yes"))
    parts.append(decision(305, 610, 190, 58, ["Filled all required", "fields?"]))
    
    # No loop back up to right form
    parts.append(poly_arrow([(495, 639), (675, 639), (675, 440), (645, 440)]))
    parts.append(branch_label(515, 630, "No"))
    
    # Yes -> Agreed with the Data Privacy Act? (Decision)
    parts.append(line_arrow(400, 668, 400, 710))
    parts.append(branch_label(415, 688, "Yes"))
    parts.append(decision(305, 710, 190, 58, ["Agreed with the", "Data Privacy Act?"]))
    
    # No -> connects into right upward bus cleanly
    parts.append(plain_line(495, 739, 675, 739))
    parts.append(plain_line(675, 739, 675, 639))
    parts.append(branch_label(515, 730, "No"))
    
    # Yes -> Submit form (Process)
    parts.append(line_arrow(400, 768, 400, 810))
    parts.append(branch_label(415, 788, "Yes"))
    parts.append(process(305, 810, 190, 45, ["Submit form"]))
    
    # Submit form -> Connector 5
    parts.append(line_arrow(495, 832.5, 565, 832.5))
    parts.append(connector_pentagon(565, 807.5, 55, 50, "5", direction="right"))
    
    # Caption and page
    parts.append('<text x="400" y="950" class="text-caption">Fig. 6.1.5 Patient Appointment</text>')
    parts.append('<text x="740" y="1000" class="page-num">27</text>')
    
    parts.append('</svg>')
    return '\n'.join(parts)

# =========================================================================
# Playwright Renderer (High-res PNGs + Merged Professional PDF)
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
        
        out_pdf = os.path.join(OUT_DIR, "flowcharts_documentation.pdf")
        await page.set_content(full_pdf_html)
        await page.wait_for_timeout(1000)
        await page.pdf(
            path=out_pdf,
            format="A4",
            print_background=True,
            margin={"top": "0", "bottom": "0", "left": "0", "right": "0"}
        )
        print(f"[PDF OK] Generated multi-page PDF: {out_pdf}")
        
        await browser.close()
    print("All flowcharts rendered and compiled into PDF successfully!")

if __name__ == "__main__":
    asyncio.run(render_all())
