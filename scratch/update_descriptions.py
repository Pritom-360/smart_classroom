import json
import os
import random

def generate_description(course_code, subject, title, is_candidate=False):
    # Dictionaries mapping course codes to specific topics for uniqueness
    topics = {
        "PHY109": ["Classical Mechanics", "Thermodynamics", "Electromagnetism", "Quantum Physics Basics", "Kinematics", "Newton's Laws", "Work and Energy"],
        "CHEM109": ["Atomic Structure", "Chemical Bonding", "Thermodynamics", "Polymers", "Alloys", "Corrosion", "Fuel Cells", "Electrochemistry"],
        "CSE103": ["C Programming", "Variables and Data Types", "Control Structures", "Functions", "Pointers", "Arrays", "File Handling", "Structures"],
        "CSE106": ["Discrete Math", "Propositional Logic", "Set Theory", "Graph Theory", "Combinatorics", "Probability", "Mathematical Proofs"],
        "CSE110": ["Java Programming", "Object-Oriented Design", "Classes and Objects", "Inheritance", "Polymorphism", "Encapsulation", "Exception Handling"],
        "CSE200": ["Algorithm Analysis", "Sorting Algorithms", "Searching Algorithms", "Dynamic Programming", "Greedy Methods", "Graph Algorithms", "Big O Notation"],
        "CSE209": ["Electrical Circuits", "Ohm's Law", "Kirchhoff's Laws", "Nodal Analysis", "Mesh Analysis", "RLC Circuits", "AC/DC Analysis"],
        "CSE207": ["Data Structures", "Arrays and Linked Lists", "Stacks and Queues", "Trees (BST, AVL)", "Graphs", "Hash Tables", "Algorithm Efficiency"],
        "CSE303": ["Descriptive Statistics", "Probability Theory", "Hypothesis Testing", "Regression Analysis", "Bayesian Statistics", "Data Mining Basics"],
        "CSE345": ["Boolean Algebra", "Logic Gates", "Combinational Circuits", "Sequential Circuits", "Flip-Flops", "Registers", "Counters"],
        "CSE406": ["Internet of Things", "Sensor Networks", "Microcontrollers (Arduino/Raspberry Pi)", "IoT Protocols", "Cloud Integration", "IoT Security"],
        "CSE405": ["OSI Model", "TCP/IP Suite", "Routing Algorithms", "Wireless Networks", "Network Security", "Socket Programming"],
        "CSE412": ["Software Development Life Cycle", "Agile Methodology", "Requirements Engineering", "UML Modeling", "Software Testing", "Project Management"],
        "CSE438": ["Image Filtering", "Edge Detection", "Image Segmentation", "Fourier Transforms", "Morphological Operations", "Color Models"],
        "CSE464": ["Query Optimization", "Transaction Management", "Concurrency Control", "Distributed Databases", "NoSQL Systems", "Database Security"],
        "CSE479": ["HTML5/CSS3", "JavaScript (ES6+)", "Frontend Frameworks (React)", "Backend Development (Node.js)", "RESTful APIs", "Web Security"],
        "CSE487": ["Cryptography", "Network Defense", "Ethical Hacking", "Risk Management", "Malware Analysis", "Cyber Laws"],
        "CSE495": ["Project Planning", "Budgeting", "Team Leadership", "Startup Lifecycle", "Risk Assessment", "Entrepreneurial Strategies"],
        "MATH101": ["Limits and Continuity", "Differentiation Techniques", "Applications of Derivatives", "Integration Methods", "Applications of Integrals"],
        "MATH102": ["First-Order ODEs", "Higher-Order Linear ODEs", "Laplace Transforms", "Fourier Series", "Special Functions"],
        "MATH104": ["Matrix Algebra", "Vector Spaces", "Eigenvalues and Eigenvectors", "Complex Variables", "Vector Calculus"],
        "ENG101": ["English Grammar", "Academic Writing", "Reading Comprehension", "Oral Communication", "Vocabulary Expansion"],
        "ENG102": ["Research Writing", "Term Paper Composition", "Literature Analysis", "Critical Thinking", "Citation Styles (APA/MLA)"],
        "FIN101": ["Time Value of Money", "Risk and Return", "Capital Budgeting", "Financial Statement Analysis", "Corporate Finance"],
        "PHY101": ["Mechanics for Admission", "Electromagnetism Applications", "Optics", "Modern Physics Concepts", "Numerical Problem Solving"],
        "CHEM101": ["Periodic Table Mastery", "Chemical Bonding Dynamics", "Organic Chemistry Mechanisms", "Inorganic Reactions", "Quantitative Chemistry"],
        "MATH100": ["Algebraic Equations", "Geometry Theorems", "Trigonometric Identities", "Probability for Admissions", "Analytical Problem Solving"],
        "BNG101": ["Bengali Literature (সাহিত্য)", "Advanced Grammar (ব্যাকরণ)", "Poetry Analysis", "Syntax and Word Formation", "Reading Comprehension"],
        "BGS101": ["Bangladesh History", "Geography of Bangladesh", "Political Systems", "Economic Development", "International Current Affairs"]
    }
    
    # Fallback if course code not directly found
    course_topics = topics.get(course_code, [
        "Core Principles", "Advanced Applications", "Theoretical Foundations", "Practical Implementation", "Case Studies", "Problem Solving"
    ])
    
    intro_paragraphs = [
        f"Welcome to the comprehensive study guide for {course_code}: {title}. This subject plays a critical foundational role in the broader context of {subject} and equips students with the necessary analytical frameworks to solve complex real-world problems. Throughout this extensively detailed curriculum, we will explore the intricate mechanisms that govern this field of study, ensuring that every learner achieves a profound and lasting mastery of the core concepts.",
        f"The study of {title} requires a rigorous, disciplined approach. As an academic pillar within the domain of {subject}, this course is meticulously structured to challenge your preconceived notions and elevate your intellectual capacity. We do not merely memorize facts; instead, we delve deeply into the underlying theories, mathematical proofs, and logical structures that form the bedrock of modern scientific and engineering practices.",
        f"In today's rapidly evolving technological landscape, the principles taught in {course_code} are more relevant than ever. From fundamental theories to advanced practical applications, this course provides a comprehensive overview of {subject}. By engaging actively with the material presented in this guide, students will not only prepare effectively for their examinations but will also build a robust knowledge base that will serve them throughout their professional careers and academic pursuits."
    ]
    
    if is_candidate:
        intro_paragraphs.append(f"For university admission candidates, {course_code} is often the deciding factor in securing a top-tier ranking. This guide focuses on high-yield topics, emphasizing speed, accuracy, and deep conceptual understanding required to excel in highly competitive entrance exams.")
    else:
        intro_paragraphs.append(f"As an essential component of the undergraduate curriculum, {course_code} bridges the gap between theoretical knowledge and practical engineering applications. Our primary goal is to foster a deep-seated understanding that goes beyond the textbook.")

    syllabus_breakdown = ""
    for i, topic in enumerate(course_topics, 1):
        syllabus_breakdown += f"<h4>Module {i}: {topic}</h4>"
        syllabus_breakdown += f"<p>This module provides an exhaustive exploration of {topic}. Students will investigate the foundational theories, engage with practical examples, and learn how to apply these concepts to complex scenarios. Mastery of {topic} is absolutely essential for progressing to the subsequent modules in {course_code}. We will analyze case studies, work through detailed numerical problems, and discuss the real-world implications of these academic concepts within the broader field of {subject}. Understanding the nuances here ensures a solid grasp of the overall course objectives.</p>"
    
    objectives = [
        f"Develop a comprehensive and intuitive understanding of {course_topics[0]} and its applications.",
        f"Apply the principles of {course_topics[1]} to solve complex, multi-step problems.",
        f"Critically analyze and evaluate scenarios involving {course_topics[2]}.",
        f"Synthesize knowledge from various modules to master the broader scope of {subject}.",
        f"Demonstrate proficiency in the practical and theoretical aspects of {course_code}.",
        "Enhance critical thinking and analytical reasoning skills required for advanced studies."
    ]
    
    prep_tips = [
        "<strong>Consistent Revision:</strong> Do not wait until the night before the exam. Review your lecture notes and these study materials daily.",
        "<strong>Solve Past Papers:</strong> Familiarize yourself with the exam format by working through previous years' question papers under timed conditions.",
        "<strong>Focus on Core Concepts:</strong> Ensure you understand the 'why' behind the formulas and theories, not just the 'how'.",
        "<strong>Collaborative Study:</strong> Form study groups to discuss complex topics. Teaching a concept to a peer is the best way to solidify your own understanding.",
        "<strong>Utilize Office Hours:</strong> Never hesitate to reach out to your professors or teaching assistants when you encounter difficult material.",
        "<strong>Practice Numerical Problems:</strong> For quantitative subjects, practice is key. Solve as many varied problems as possible to build confidence.",
        "<strong>Create Summary Sheets:</strong> Condense each module into a one-page summary sheet containing key formulas, definitions, and theorems for quick review."
    ]
    
    if is_candidate:
        prep_tips.append("<strong>Time Management during Exams:</strong> Practice solving questions quickly. In admission tests, time is your biggest enemy.")
        prep_tips.append("<strong>Elimination Technique:</strong> For multiple-choice questions, learn to quickly eliminate obviously wrong answers to increase your chances of guessing correctly if unsure.")

    # Assemble the HTML
    html = f"<h2>Academic Introduction to {course_code}: {title}</h2>"
    for p in intro_paragraphs:
        html += f"<p>{p}</p>"
        
    # Add filler academic text to ensure word count
    html += f"<p>Furthermore, the pedagogical approach taken in this guide for {course_code} emphasizes active learning and cognitive engagement. Research has consistently shown that passive reading is insufficient for mastering complex material in {subject}. Therefore, students are strongly encouraged to interact with the content, ask probing questions, and seek out connections between different modules. The integration of knowledge across various domains is what separates a novice from an expert. By dedicating yourself to the rigorous study of these materials, you are investing in your intellectual growth and laying the groundwork for future innovations.</p>"
    
    html += "<h3>Key Learning Objectives</h3>"
    html += "<ul>"
    for obj in objectives:
        html += f"<li>{obj}</li>"
    html += "</ul>"
    
    html += "<h3>Detailed Syllabus Breakdown</h3>"
    html += syllabus_breakdown
    
    # Add more filler
    html += f"<p>The culmination of these modules represents a holistic understanding of {course_code}. Each topic has been carefully selected and structured to build upon the previous one, creating a cohesive and comprehensive learning experience. It is imperative that students do not skip any sections, as the knowledge is cumulative and highly interconnected.</p>"

    html += "<h3>Preparation Tips for Exams</h3>"
    html += "<ul>"
    for tip in prep_tips:
        html += f"<li>{tip}</li>"
    html += "</ul>"
    
    html += f"<p>In conclusion, achieving excellence in {course_code} requires dedication, strategic planning, and a genuine curiosity about the subject matter. Use this guide as your primary roadmap, but do not hesitate to explore supplementary textbooks and academic journals to deepen your understanding. We wish you the utmost success in your academic journey and are confident that your hard work will yield outstanding results.</p>"

    return html

def update_json_file(filepath, list_key, is_candidate=False):
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    courses = data.get(list_key, [])
    for course in courses:
        code = course.get('courseCode', 'UNKNOWN')
        subject = course.get('subject', 'General')
        title = course.get('title', 'Course')
        
        new_desc = generate_description(code, subject, title, is_candidate)
        course['longDescription'] = new_desc
        
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    base_dir = r"e:\Websites\smart-classroom\data"
    students_file = os.path.join(base_dir, "subjects_students.json")
    candidates_file = os.path.join(base_dir, "subjects_candidates.json")
    
    update_json_file(students_file, "students", is_candidate=False)
    update_json_file(candidates_file, "candidates", is_candidate=True)
    print("Successfully updated both JSON files with high-quality academic descriptions.")
