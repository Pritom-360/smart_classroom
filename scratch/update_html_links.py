import os
import glob
import re

directory = r"e:\Websites\smart-classroom"
html_files = glob.glob(os.path.join(directory, "*.html"))

nav_blog_pattern = re.compile(r'<a\s+href="[^"]*blog[^"]*"\s*(?:target="_blank"\s*)?class="nav-blog-highlight"[^>]*>[\s\S]*?</a>', re.IGNORECASE)
nav_blog_pattern_2 = re.compile(r'<a\s+href="[^"]*blog[^"]*"\s*class="nav-blog-highlight"[^>]*>[\s\S]*?</a>', re.IGNORECASE)

new_resources_link = '<a href="resources.html" class="nav-resources-highlight"><i class="fas fa-book-open"></i> Resources</a>'

menu_toggle_pattern = re.compile(r'<button\s+id="menu-toggle"[^>]*>\s*<i\s+class="fas fa-bars"></i>\s*<\/button>', re.IGNORECASE)
new_menu_toggle = '<button id="menu-toggle" aria-label="Open Menu"><i class="fas fa-ellipsis-v"></i></button>'

for file_path in html_files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    # Replace nav blog link
    content = nav_blog_pattern.sub(new_resources_link, content)
    content = nav_blog_pattern_2.sub(new_resources_link, content)
    
    # Replace menu toggle
    content = menu_toggle_pattern.sub(new_menu_toggle, content)

    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {os.path.basename(file_path)}")

print("Done updating HTML files.")
