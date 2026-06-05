import os
import glob
import re

base_dir = r"e:\Websites\smart-classroom"
html_files = glob.glob(os.path.join(base_dir, "*.html"))

tag = """
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-9WBZ6V352D"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());

      gtag('config', 'G-9WBZ6V352D');
    </script>"""

for file_path in html_files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Skip if tag already exists
    if "G-9WBZ6V352D" in content:
        print(f"Tag already exists in {os.path.basename(file_path)}")
        continue

    # Insert tag immediately after <head>
    # Using regex to find <head> (case insensitive)
    # We replace <head> with <head>\n{tag}
    content = re.sub(r'(<head\b[^>]*>)', r'\1\n' + tag, content, count=1, flags=re.IGNORECASE)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Google tag injected into all HTML files successfully.")
