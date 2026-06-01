import os
import re

# Read a base HTML file to get the structure
directory = r"e:\Websites\smart-classroom"
base_file = os.path.join(directory, "about.html")
target_file = os.path.join(directory, "resources.html")

with open(base_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace title
content = re.sub(r'<title>.*?</title>', '<title>Resources - The Importance of Open Educational Resources</title>', content)

# Remove the hero/main section of about and insert the article
# Find <main class="container"> and replace everything inside it up to </main>
article_html = """
        <div class="page-header reveal">
            <h2 class="heading-accent">Educational Resources</h2>
            <p class="tagline">The Importance of Open Educational Resources for University Students</p>
        </div>
        <div class="glass-panel reveal" style="padding: 2rem; margin-bottom: 2rem; text-align: justify; line-height: 1.8; font-size: 1.1rem; color: var(--text-main);">
            <h3>Introduction to Open Educational Resources</h3>
            <p>In today’s rapidly changing educational landscape, the concept of Open Educational Resources (OER) has emerged as a revolutionary force, fundamentally altering how university students access, interact with, and benefit from academic materials. OER encompasses freely accessible, openly licensed text, media, and other digital assets that are useful for teaching, learning, and assessing as well as for research purposes. The importance of these resources cannot be overstated, particularly for university students who often face significant barriers to acquiring the necessary materials for their coursework. By breaking down these barriers, OER not only democratizes education but also enhances the overall academic experience.</p>
            
            <p>The traditional model of university education often requires students to purchase expensive textbooks, access codes for online platforms, and other supplementary materials. These costs can be prohibitive, forcing many students to make difficult choices between buying necessary academic resources and meeting basic living expenses. In some cases, students may even opt out of purchasing textbooks altogether, which can severely impact their academic performance and overall understanding of the subject matter. This is where Open Educational Resources step in to bridge the gap, providing high-quality, peer-reviewed content at no cost to the learner.</p>
            
            <h3>Financial Relief and Increased Accessibility</h3>
            <p>One of the most immediate and tangible benefits of OER is the significant financial relief it provides to students. The rising cost of higher education is a well-documented issue globally, and textbooks represent a substantial portion of this financial burden. By utilizing free, open-source materials, students can save hundreds or even thousands of dollars over the course of their degree programs. This financial alleviation allows students to redirect their funds toward other essential needs, such as tuition, housing, and food, thereby reducing stress and promoting a more focused and healthy academic life.</p>
            
            <p>Moreover, the accessibility provided by OER is unparalleled. Digital resources can be accessed from anywhere in the world, at any time, using a variety of devices, including laptops, tablets, and smartphones. This flexibility is particularly beneficial for non-traditional students, such as those who work part-time or full-time, have family responsibilities, or commute long distances. With OER, a student can read a chapter on the bus, watch a lecture video during a lunch break, or complete an interactive simulation late at night. This ubiquitous access ensures that learning is not confined to the physical boundaries of a classroom or the operating hours of a library.</p>
            
            <h3>Enhancing Pedagogical Innovation</h3>
            <p>Beyond the financial and accessibility advantages, Open Educational Resources also empower educators to innovate their pedagogical approaches. Traditional textbooks are often static, updated infrequently, and may not perfectly align with an instructor’s specific syllabus or teaching style. In contrast, OER materials, due to their open licensing, can be adapted, customized, and remixed by educators to suit the unique needs of their students. An instructor can combine chapters from different open textbooks, integrate current events into the curriculum, and tailor the content to reflect diverse perspectives and local contexts.</p>
            
            <p>This adaptability not only ensures that the material remains relevant and up-to-date but also fosters a more engaging and personalized learning experience. When students see that the course materials have been specifically curated and adapted for their class, they are more likely to engage deeply with the content. Furthermore, the collaborative nature of OER encourages educators to share their customized materials with the broader academic community, leading to a continuous cycle of improvement and innovation in teaching resources.</p>
            
            <h3>Promoting Equity and Inclusion</h3>
            <p>Equity and inclusion are critical pillars of modern higher education, and OER plays a vital role in supporting these principles. As mentioned earlier, the high cost of traditional educational materials disproportionately affects students from low-income backgrounds. By providing free access to essential resources from day one of a course, OER ensures that all students, regardless of their socioeconomic status, have an equal opportunity to succeed. No student should be left behind simply because they cannot afford the required textbook.</p>
            
            <p>Furthermore, the ability to adapt OER allows educators to incorporate diverse voices and perspectives that may be missing from traditional, commercially published textbooks. Instructors can modify materials to include examples, case studies, and historical contexts that resonate with a diverse student body. This cultural responsiveness in course materials not only makes learning more relatable but also validates the experiences and identities of all students, fostering a more inclusive and welcoming academic environment.</p>
            
            <h3>Empowering Student-Centered Learning</h3>
            <p>Open Educational Resources also shift the paradigm from a teacher-centered model to a more student-centered approach to learning. With a wealth of freely available resources, students are encouraged to take ownership of their educational journeys. If a student struggles to understand a concept as explained in one resource, they have the freedom to seek out alternative explanations, videos, or interactive simulations online without incurring additional costs. This abundance of materials caters to different learning styles, whether a student is a visual learner, an auditory learner, or someone who learns best through hands-on practice.</p>
            
            <p>Additionally, the open nature of these resources invites students to become co-creators of knowledge rather than mere consumers. Many OER initiatives encourage student participation in creating, editing, and improving educational materials. For instance, a class project might involve updating a chapter in an open textbook or creating a new instructional video. These types of assignments not only reinforce the students' understanding of the subject matter but also provide them with valuable skills in digital literacy, collaboration, and critical thinking.</p>
            
            <h3>The Global Impact of OER</h3>
            <p>The impact of Open Educational Resources extends far beyond individual classrooms and universities; it has profound implications for global education. In developing nations, where educational funding is often severely limited, OER provides access to world-class educational materials that would otherwise be completely out of reach. Universities and students in these regions can utilize resources created by leading academics and institutions globally, thereby significantly elevating the quality of education available to them.</p>
            
            <p>This global sharing of knowledge fosters international collaboration and helps to bridge the educational divide between developed and developing countries. As more institutions worldwide adopt and contribute to the OER ecosystem, the repository of available knowledge continues to grow, creating a massive, interconnected web of learning resources that benefits humanity as a whole.</p>
            
            <h3>Challenges and the Road Ahead</h3>
            <p>Despite the numerous benefits of Open Educational Resources, widespread adoption still faces several challenges. One of the primary obstacles is awareness; many educators and students are still unfamiliar with OER and where to find high-quality, peer-reviewed materials. Additionally, some faculty members may be hesitant to transition away from traditional textbooks due to concerns about the time and effort required to curate and adapt new materials. There is also the ongoing challenge of ensuring the long-term sustainability and continuous updating of OER repositories.</p>
            
            <p>However, these challenges are not insurmountable. Universities and academic institutions are increasingly recognizing the value of OER and are implementing support systems, such as grants and professional development workshops, to encourage faculty adoption. Librarians, in particular, play a crucial role as champions of OER, assisting faculty in discovering and evaluating open materials. As the movement gains momentum, it is clear that OER is not just a passing trend but a fundamental shift in the dissemination of academic knowledge.</p>
            
            <h3>Conclusion</h3>
            <p>In conclusion, the importance of Open Educational Resources for university students is immense and multifaceted. By eliminating the financial barriers associated with traditional textbooks, OER ensures that education is accessible, equitable, and inclusive for all learners. The flexibility and adaptability of open materials empower educators to innovate their teaching methods and provide a more personalized and engaging learning experience. Furthermore, OER encourages student-centered learning and contributes to the global democratization of knowledge.</p>
            
            <p>As we look to the future of higher education, the continued expansion and integration of Open Educational Resources will be critical in shaping a more accessible and equitable academic environment. It is imperative that universities, educators, and policymakers continue to support and advocate for the OER movement, ensuring that every student has the tools they need to succeed academically and realize their full potential. The transition to open resources is more than just a cost-saving measure; it is a profound commitment to the democratization of education and the belief that knowledge should be a public good, freely available to anyone with the desire to learn.</p>
        </div>
"""

# Replace the main container content using regex
content = re.sub(r'(<main class="container">)([\s\S]*?)(</main>)', r'\1\n' + article_html + r'\n\3', content)

with open(target_file, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Created {target_file} successfully.")
