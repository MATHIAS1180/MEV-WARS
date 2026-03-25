import re

with open('app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Change timer position from -top-20 to top-4 (visible position)
content = content.replace(
    'className="absolute -top-20 sm:-top-24 left-1/2 -translate-x-1/2 z-30"',
    'className="absolute top-4 sm:top-6 left-1/2 -translate-x-1/2 z-30"'
)

# Fix 2: Replace the broken UTF-8 character with proper em dash
content = content.replace('ÔÇö', '—')

# Also try other variations
content = content.replace('Ã¢ÂÂ', '—')

with open('app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed!")
print("1. Timer position: -top-20 -> top-4 (now visible)")
print("2. Button text: ÔÇö -> — (proper em dash)")
