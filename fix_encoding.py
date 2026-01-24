import re

# Fix donation.html
with open('e:/Websites/smart-classroom/donation.html', 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

# Fix various corrupted em-dash patterns
# Pattern 1: â€" (common UTF-8 mojibake for em-dash)
content = content.replace('\u00e2\u20ac\u201c', '\u2014')
# Pattern 2: â€" another form
content = content.replace('\u00e2\u20ac\u201d', '\u2014')
# Pattern 3: direct replacement using regex for any remaining patterns
content = re.sub(r'â€"', '—', content)
content = re.sub(r'â€"', '—', content)

with open('e:/Websites/smart-classroom/donation.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('Donation page fixed!')
