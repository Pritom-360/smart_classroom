import os
import glob
import re
import json
import urllib.parse

base_url = "https://www.catalyst-smart-classroom.me"
base_dir = r"e:\Websites\smart-classroom"

html_files = glob.glob(os.path.join(base_dir, "*.html"))

# Create SEO configurations
seo_data = {
    "index.html": "Smart Classroom is a leading educational platform offering thousands of free university lecture notes, study guides, and interactive course materials. Designed specifically for university students and admission candidates.",
    "about.html": "Learn about the Smart Classroom story, our non-profit community initiative, and our mission to democratize digital education. Discover the developers and educators dedicated to making high-quality university learning resources accessible.",
    "appreciation.html": "Explore the heartfelt appreciations and testimonials from university students and educators who have benefited from Smart Classroom's free academic resources, study guides, and interactive learning tools.",
    "community.html": "Join the vibrant Smart Classroom community. Connect with fellow university students, share study resources, collaborate on academic projects, and participate in our forums dedicated to collaborative digital education.",
    "contact.html": "Get in touch with the Smart Classroom team for technical support, academic partnerships, or editorial feedback. Review our strict editorial policy and reach out via our professional contact form or WhatsApp for immediate assistance.",
    "contributions.html": "Contribute to the Smart Classroom initiative. Share your lecture notes, study guides, and academic insights. Help us build a massive, open-access repository of university educational resources for students worldwide.",
    "course.html": "Dive into comprehensive course materials, detailed syllabus breakdowns, and in-depth academic study guides on Smart Classroom. Access expertly crafted content designed to help university students excel in their specific courses.",
    "cp.html": "Master Competitive Programming with Smart Classroom. Access advanced algorithms, data structures tutorials, and problem-solving strategies tailored for university students preparing for coding interviews and global programming contests.",
    "donation.html": "Support the Smart Classroom non-profit initiative. Your generous donations help us maintain our servers, develop new educational simulators, and ensure that our high-quality academic resources remain completely free for all students.",
    "download-buffer.html": "Securely download your requested university course materials, lecture notes, and academic PDFs from Smart Classroom. Our platform ensures fast, reliable access to the educational resources you need to succeed in your studies.",
    "jobs.html": "Explore career opportunities, academic internships, and tech job listings curated specifically for university students and recent graduates within the Smart Classroom ecosystem and our broader network of industry partners.",
    "privacy.html": "Review the comprehensive Privacy Policy of Smart Classroom. Learn how we securely handle user data, our use of cookies, Google AdSense compliance, and our strict adherence to international regulations like GDPR and CCPA.",
    "products.html": "Discover educational products and digital learning tools developed by Smart Classroom. From interactive software simulators to specialized academic guides, our products are designed to elevate your university learning experience.",
    "resources.html": "Read our comprehensive articles and essays on the importance of Open Educational Resources (OER). Discover how free digital materials, interactive simulators, and open-access textbooks are transforming university education globally.",
    "simulators.html": "Experience hands-on learning with Smart Classroom's interactive digital simulators. Practice complex concepts in physics, electronics, and computer science in a risk-free virtual environment designed for university students.",
    "subject-view.html": "Browse detailed overviews of specific university subjects on Smart Classroom. Access specialized study materials, lecture slides, and preparatory guides tailored for both enrolled university students and admission candidates.",
    "subjects.html": "Explore the complete catalog of university subjects and academic courses available on Smart Classroom. From Computer Science and Engineering to Physics and Mathematics, find the exact study resources you need for your degree."
}

# 1. Update HTML files (Canonical and Meta Description)
for file_path in html_files:
    filename = os.path.basename(file_path)
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Determine canonical URL
    if filename == "index.html":
        canonical_url = f"{base_url}/"
    else:
        canonical_url = f"{base_url}/{filename}"

    # Determine Meta Description
    desc = seo_data.get(filename, f"Access premium university study materials, lecture notes, and interactive learning resources on Smart Classroom. Our platform provides comprehensive tools for {filename.replace('.html', '')}.")

    # Update canonical
    if '<link rel="canonical"' in content:
        content = re.sub(r'<link\s+rel="canonical"\s+href="[^"]*">', f'<link rel="canonical" href="{canonical_url}">', content, flags=re.IGNORECASE)
    else:
        # Insert before </head>
        content = re.sub(r'</head>', f'    <link rel="canonical" href="{canonical_url}">\n</head>', content, flags=re.IGNORECASE)

    # Update meta description
    if '<meta name="description"' in content:
        content = re.sub(r'<meta\s+name="description"\s+content="[^"]*">', f'<meta name="description" content="{desc}">', content, flags=re.IGNORECASE)
    else:
        # Insert before </head>
        content = re.sub(r'</head>', f'    <meta name="description" content="{desc}">\n</head>', content, flags=re.IGNORECASE)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

# 2. Build sitemap.xml
urls = []
for filename in seo_data.keys():
    if filename == "index.html":
        urls.append(f"{base_url}/")
    else:
        urls.append(f"{base_url}/{filename}")

# Load JSON for dynamic courses
students_json_path = os.path.join(base_dir, "data", "subjects_students.json")
candidates_json_path = os.path.join(base_dir, "data", "subjects_candidates.json")

def extract_course_urls(json_path, role):
    course_urls = []
    if os.path.exists(json_path):
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            for department, courses in data.items():
                dept_encoded = urllib.parse.quote(department)
                course_urls.append(f"{base_url}/subject-view.html?subject={dept_encoded}&amp;role={role}")
                for course in courses:
                    code = course.get("code")
                    if code:
                        code_encoded = urllib.parse.quote(code)
                        course_urls.append(f"{base_url}/course.html?code={code_encoded}&amp;role={role}")
    return course_urls

student_urls = extract_course_urls(students_json_path, "student")
candidate_urls = extract_course_urls(candidates_json_path, "candidate")

# De-duplicate
all_dynamic = list(set(student_urls + candidate_urls))
urls.extend(all_dynamic)

sitemap_content = '<?xml version="1.0" encoding="UTF-8"?>\n'
sitemap_content += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

for u in urls:
    sitemap_content += '  <url>\n'
    sitemap_content += f'    <loc>{u}</loc>\n'
    sitemap_content += '    <changefreq>weekly</changefreq>\n'
    sitemap_content += '    <priority>0.8</priority>\n'
    sitemap_content += '  </url>\n'

sitemap_content += '</urlset>'

sitemap_path = os.path.join(base_dir, "sitemap.xml")
with open(sitemap_path, "w", encoding="utf-8") as f:
    f.write(sitemap_content)

# 3. Build robots.txt
robots_content = f"""User-agent: *
Allow: /

Sitemap: {base_url}/sitemap.xml
"""

robots_path = os.path.join(base_dir, "robots.txt")
with open(robots_path, "w", encoding="utf-8") as f:
    f.write(robots_content)

print(f"SEO update complete. Added {len(urls)} URLs to sitemap.")
