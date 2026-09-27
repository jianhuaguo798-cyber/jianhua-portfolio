"""Regenerate the clearly labeled, one-page portfolio download demo."""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4

root = Path(__file__).resolve().parents[1]
out = root / 'downloads' / 'portfolio.pdf'
out.parent.mkdir(exist_ok=True)
w, h = A4
c = canvas.Canvas(str(out), pagesize=A4)
c.setTitle('Guo Jianhua - Portfolio Download Demo')
c.setAuthor('Guo Jianhua')
c.setFillColor(HexColor('#05070d'))
c.rect(0, 0, w, h, fill=1, stroke=0)
c.setFillColor(HexColor('#7de3ff'))
c.circle(55, h-61, 4, stroke=0, fill=1)
c.setFont('Helvetica', 10)
c.drawString(72, h-65, 'GUO JIANHUA / 2026')
c.setStrokeColor(HexColor('#293343'))
c.line(50, h-94, w-50, h-94)
c.setFillColor(HexColor('#eef1f8'))
c.setFont('Helvetica-Bold', 57)
c.drawString(48, h-220, 'Portfolio.')
c.setFont('Helvetica', 22)
c.setFillColor(HexColor('#7de3ff'))
c.drawString(50, h-266, 'UX / UI / INTERACTION')
c.setFillColor(HexColor('#151b29'))
c.roundRect(50, 271, w-100, 212, 16, stroke=0, fill=1)
c.setFillColor(HexColor('#ffbcdF'))
c.setFont('Helvetica-Bold', 12)
c.drawString(73, 450, 'DEMO FILE - NOT THE FINAL PORTFOLIO')
c.setFillColor(HexColor('#c3cbdc'))
c.setFont('Helvetica', 12)
for i, line in enumerate([
    'This one-page sample verifies the website download.',
    'It contains no real case studies or project claims.',
    '',
    'The final portfolio will replace this file at the same URL.',
    'Thank you for visiting.',
]):
    c.drawString(73, 415-i*24, line)
c.setFillColor(HexColor('#98a0b3'))
c.setFont('Helvetica', 11)
c.drawString(50, 182, 'Contact')
c.setFillColor(HexColor('#eef1f8'))
c.drawString(50, 159, 'jianhuaguo798@gmail.com')
c.linkURL('mailto:jianhuaguo798@gmail.com', (50,153,275,174))
c.setStrokeColor(HexColor('#293343'))
c.line(50, 93, w-50, 93)
c.setFillColor(HexColor('#98a0b3'))
c.setFont('Helvetica', 9)
c.drawString(50, 69, 'WEBSITE V1.0 / DOWNLOAD SAMPLE')
c.drawRightString(w-50, 69, '01 / 01')
c.save()
print(out)
