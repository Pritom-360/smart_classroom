import os
import re

base_dir = r"e:\Websites\smart-classroom"

# 1. Update privacy.html
privacy_path = os.path.join(base_dir, "privacy.html")
with open(privacy_path, "r", encoding="utf-8") as f:
    privacy_content = f.read()

privacy_html = """
                <h1>Comprehensive Privacy Policy</h1>
                <p class="last-updated">Last updated: June 1, 2026</p>

                <p>Welcome to Smart Classroom ("we," "our," or "us"). At Smart Classroom, accessible from https://www.catalyst-smart-classroom.me/, one of our primary priorities is the privacy and security of our visitors and users. This comprehensive Privacy Policy document details the types of information that is collected and recorded by Smart Classroom, how we use it, your rights regarding your data, and how we comply with global privacy regulations including the General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA).</p>

                <p>If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us. This Privacy Policy applies only to our online activities and is valid for visitors to our website with regards to the information that they shared and/or collect in Smart Classroom. This policy is not applicable to any information collected offline or via channels other than this website.</p>

                <h2>1. Information We Collect</h2>
                <p>The personal information that you are asked to provide, and the reasons why you are asked to provide it, will be made clear to you at the point we ask you to provide your personal information.</p>
                <p>If you contact us directly, we may receive additional information about you such as your name, email address, phone number, the contents of the message and/or attachments you may send us, and any other information you may choose to provide.</p>
                <p>When you register for an Account or interact with our platform (e.g., simulators, study materials), we may ask for your contact information, including items such as name, institution, email address, and academic preferences. This information is strictly used to tailor the educational experience to your needs.</p>

                <h2>2. How We Use Your Information</h2>
                <p>We use the information we collect in various ways, including to:</p>
                <ul>
                    <li>Provide, operate, and maintain our educational website.</li>
                    <li>Improve, personalize, and expand our website's content and resources.</li>
                    <li>Understand and analyze how you use our website to optimize the user interface and learning experience.</li>
                    <li>Develop new products, services, simulators, features, and functionality.</li>
                    <li>Communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the website.</li>
                    <li>Send you educational newsletters and updates (only if opted-in).</li>
                    <li>Find and prevent fraud or malicious activities.</li>
                </ul>

                <h2>3. Log Files and Analytics</h2>
                <p>Smart Classroom follows a standard procedure of using log files. These files log visitors when they visit websites. All hosting companies do this and are a part of hosting services' analytics. The information collected by log files includes internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks. These are not linked to any information that is personally identifiable. The purpose of the information is for analyzing trends, administering the site, tracking users' movement on the website, and gathering demographic information to ensure our educational resources are reaching the right audiences effectively.</p>

                <h2>4. Cookies and Web Beacons</h2>
                <p>Like any other website, Smart Classroom uses "cookies". These cookies are used to store information including visitors' preferences, and the pages on the website that the visitor accessed or visited. The information is used to optimize the users' experience by customizing our web page content based on visitors' browser type and/or other information.</p>
                <p>Cookies are small data files placed on your device or computer and often include an anonymous unique identifier. For more information about cookies, and how to disable cookies, you can consult your browser's official documentation. We use both session cookies (which expire once you close your web browser) and persistent cookies (which stay on your device until you delete them) to provide you with a more personal and interactive experience on our website.</p>

                <h2>5. Google AdSense and DoubleClick DART Cookie</h2>
                <p>Smart Classroom is partially supported through advertising revenue. Google is a third-party vendor on our site. It uses cookies, known as DART cookies, to serve ads to our site visitors based upon their visit to www.catalyst-smart-classroom.me and other sites on the internet. However, visitors may choose to decline the use of DART cookies by visiting the Google ad and content network Privacy Policy at the following URL: <a href="https://policies.google.com/technologies/ads" target="_blank">https://policies.google.com/technologies/ads</a>.</p>
                <p>Google AdSense uses advertising cookies to enable it and its partners to serve ads to users based on their prior visits to our site or other websites. Users may opt-out of personalized advertising by visiting Google's Ads Settings.</p>

                <h2>6. Advertising Partners and Third-Party Policies</h2>
                <p>Some advertisers on our site may use cookies and web beacons. Our advertising partners include Google AdSense and potentially other educational affiliates. Each of our advertising partners has its own Privacy Policy for its policies on user data.</p>
                <p>Third-party ad servers or ad networks use technologies like cookies, JavaScript, or Web Beacons that are used in their respective advertisements and links that appear on Smart Classroom, which are sent directly to users' browsers. They automatically receive your IP address when this occurs. These technologies are used to measure the effectiveness of their advertising campaigns and/or to personalize the advertising content that you see on websites that you visit.</p>
                <p>Note that Smart Classroom has absolutely no access to or control over these cookies that are used by third-party advertisers. We advise you to consult the respective Privacy Policies of these third-party ad servers for more detailed information.</p>

                <h2>7. CCPA Privacy Rights (Do Not Sell My Personal Information)</h2>
                <p>Under the California Consumer Privacy Act (CCPA), among other rights, California consumers have the right to:</p>
                <ul>
                    <li>Request that a business that collects a consumer's personal data disclose the categories and specific pieces of personal data that a business has collected about consumers.</li>
                    <li>Request that a business delete any personal data about the consumer that a business has collected.</li>
                    <li>Request that a business that sells a consumer's personal data, not sell the consumer's personal data.</li>
                </ul>
                <p>We do not sell personal information. If you make a request, we have one month to respond to you. If you would like to exercise any of these rights, please contact us.</p>

                <h2>8. GDPR Data Protection Rights</h2>
                <p>We would like to make sure you are fully aware of all of your data protection rights. Every user operating within the European Economic Area (EEA) is entitled to the following under the General Data Protection Regulation (GDPR):</p>
                <ul>
                    <li><strong>The right to access</strong> – You have the right to request copies of your personal data. We may charge you a small fee for this service.</li>
                    <li><strong>The right to rectification</strong> – You have the right to request that we correct any information you believe is inaccurate. You also have the right to request that we complete the information you believe is incomplete.</li>
                    <li><strong>The right to erasure</strong> – You have the right to request that we erase your personal data, under certain conditions.</li>
                    <li><strong>The right to restrict processing</strong> – You have the right to request that we restrict the processing of your personal data, under certain conditions.</li>
                    <li><strong>The right to object to processing</strong> – You have the right to object to our processing of your personal data, under certain conditions.</li>
                    <li><strong>The right to data portability</strong> – You have the right to request that we transfer the data that we have collected to another organization, or directly to you, under certain conditions.</li>
                </ul>
                <p>If you make a request, we have one month to respond to you. If you would like to exercise any of these rights, please contact us via our official channels.</p>

                <h2>9. Children's Information and COPPA Compliance</h2>
                <p>Another part of our priority is adding protection for children while using the internet. We encourage parents and guardians to observe, participate in, and/or monitor and guide their online activity.</p>
                <p>Smart Classroom does not knowingly collect any Personal Identifiable Information from children under the age of 13, in strict compliance with the Children's Online Privacy Protection Act (COPPA). If you think that your child provided this kind of information on our website, we strongly encourage you to contact us immediately and we will do our best efforts to promptly remove such information from our records.</p>

                <h2>10. Data Retention and Security</h2>
                <p>We will only retain your personal data for as long as reasonably necessary to fulfill the purposes we collected it for, including for the purposes of satisfying any legal, regulatory, tax, accounting, or reporting requirements. To determine the appropriate retention period for personal data, we consider the amount, nature, and sensitivity of the personal data, the potential risk of harm from unauthorized use or disclosure, and applicable legal requirements.</p>
                <p>We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way, altered, or disclosed. However, no internet transmission is ever completely secure or error-free. In particular, emails sent to or from our website may not be secure.</p>

                <h2>11. External Links to Other Websites</h2>
                <p>Our website may contain links to other websites of interest. However, once you have used these links to leave our site, you should note that we do not have any control over that other website. Therefore, we cannot be responsible for the protection and privacy of any information which you provide whilst visiting such sites and such sites are not governed by this privacy statement. You should exercise caution and look at the privacy statement applicable to the website in question.</p>

                <h2>12. Consent and Updates</h2>
                <p>By using our website, you hereby consent to our Privacy Policy and agree to its Terms and Conditions. We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.</p>

                <h2>13. Contact Information</h2>
                <p>If you have any questions, concerns, or requests regarding this Privacy Policy, please contact our data protection team at <strong>support@smartclassroom.edu</strong> or <strong>pritombhowmik360@gmail.com</strong>.</p>
"""
privacy_content = re.sub(r'<div class="privacy-card">[\s\S]*?</div>', f'<div class="privacy-card">{privacy_html}</div>', privacy_content)

with open(privacy_path, "w", encoding="utf-8") as f:
    f.write(privacy_content)

# 2. Update about.html
about_path = os.path.join(base_dir, "about.html")
with open(about_path, "r", encoding="utf-8") as f:
    about_content = f.read()

story_html = """
            <!-- Smart Classroom Story Section -->
            <div class="story-section glass-panel" style="margin-bottom: 4rem; padding: 3rem; text-align: justify; line-height: 1.8;">
                <h2 class="gradient-text" style="font-size: 2.2rem; margin-bottom: 1.5rem; text-align: center;">The Smart Classroom Story: A Non-Profit Community Initiative</h2>
                
                <p>The journey of Smart Classroom began with a simple, profound realization: access to quality educational resources should not be a privilege dictated by geographic location, institutional affiliation, or financial capacity. It should be a fundamental right. In an era dominated by rapid technological advancement, the gap between those who have access to premium learning materials and those who do not has only widened. Smart Classroom was conceptualized and launched as a non-profit community initiative specifically designed to bridge this educational divide, empowering students across the globe—and particularly in developing regions—with the tools they need to succeed academically and professionally.</p>
                
                <p>At its core, Smart Classroom is a testament to the power of community-driven development. It is not a commercial enterprise built for profit, but rather a collaborative platform engineered by passionate developers, educators, and student volunteers. The initiative was spearheaded by Arup Bhowmik Pritom, a Computer Science student who personally experienced the challenges of navigating complex academic curricula without adequate supplementary resources. Driven by a desire to help his peers, Pritom began compiling lecture notes, developing interactive coding simulators, and organizing syllabus structures into an easily accessible digital format. What started as a personal repository quickly evolved into a comprehensive digital ecosystem utilized by thousands of university students and admission candidates.</p>
                
                <p>The mission of Smart Classroom is unequivocally clear: to democratize digital education. The traditional educational model often relies heavily on static, expensive textbooks and monolithic lecture formats. Smart Classroom disrupts this paradigm by offering a dynamic, multifaceted approach to learning. By integrating high-quality academic texts, open educational resources (OER), and interactive simulators directly into the browser, the platform transforms passive reading into active engagement. Whether a student is grappling with the nuances of Object-Oriented Programming in Java, exploring the complexities of Differential Calculus, or mastering the principles of Engineering Physics, Smart Classroom provides a structured, comprehensive, and entirely free pathway to mastery.</p>
                
                <p>A critical component of this initiative is its reliance on open-source principles and community contributions. The developers behind Smart Classroom understand that no single individual or small team can encompass the vast breadth of academic knowledge required to support a diverse university student body. Therefore, the platform operates as a collaborative hub. Faculty members, academic achievers, and subject matter experts are encouraged to contribute their notes, insights, and study guides. This open-access model ensures that the content remains relevant, accurate, and continuously updated. It fosters a culture of shared knowledge, where the success of one student contributes to the success of many.</p>
                
                <p>The technological architecture of Smart Classroom was meticulously designed to prioritize accessibility and performance. Recognizing that many students in developing regions access the internet via mobile devices with limited bandwidth, the platform was built to be lightweight, incredibly fast, and fully responsive. The implementation of modern web technologies ensures that complex interactive features, such as the digital circuit simulator or the integrated code editor, run seamlessly across devices without requiring high-end hardware. This technical inclusivity is a cornerstone of the Smart Classroom philosophy; advanced educational tools must be available to everyone, regardless of their device's capabilities.</p>
                
                <p>Beyond traditional course materials, Smart Classroom is pioneering the integration of artificial intelligence and automation in education. Through sister projects like ScholarHub AI, the development team is exploring how large language models (LLMs) and Retrieval-Augmented Generation (RAG) systems can be utilized to assist researchers and students in navigating dense academic papers and complex datasets. These advanced features are being integrated into the Smart Classroom ecosystem not as paid add-ons, but as core functionalities, further solidifying the platform's commitment to cutting-edge, accessible digital education.</p>
                
                <p>The impact of this non-profit initiative is measured not in revenue, but in the academic achievements of its users. The platform provides critical support for admission candidates, offering them a clear, structured overview of university syllabi, helping them make informed decisions about their future academic pursuits. For current university students, it serves as an indispensable daily companion, reducing the stress associated with complex coursework and exam preparation. The introduction of role-switching features allows the platform to intelligently tailor its interface and content delivery based on whether the user is a prospective candidate or an enrolled student, ensuring a highly personalized educational journey.</p>
                
                <p>Looking ahead, the Smart Classroom initiative is committed to continuous expansion and innovation. The roadmap includes the integration of more diverse academic disciplines, the development of advanced virtual laboratory environments, and the establishment of global partnerships with other educational non-profits and academic institutions. The developers are constantly exploring new ways to leverage cloud computing, automation workflows, and community engagement to enhance the learning experience. The ultimate vision is to create a universally accessible, endlessly scalable educational platform that completely eradicates the barriers to high-quality academic resources.</p>
                
                <p>In conclusion, Smart Classroom is more than just a website; it is a movement toward educational equity. It stands as a shining example of how technology, when wielded with purpose and compassion, can profoundly impact society. By providing a free, comprehensive, and technologically advanced learning environment, the developers and the broader community behind Smart Classroom are not just supplementing traditional education; they are redefining it for the digital age. They are proving that with dedication, collaboration, and a steadfast commitment to the mission of open education, we can create a world where every student has the opportunity to learn, grow, and achieve their highest potential.</p>
            </div>
"""

# Insert the story_html right before the profile-section
about_content = re.sub(r'(<!-- Profile Section -->)', story_html + r'\n            \1', about_content)

with open(about_path, "w", encoding="utf-8") as f:
    f.write(about_content)

# 3. Update contact.html
contact_path = os.path.join(base_dir, "contact.html")
with open(contact_path, "r", encoding="utf-8") as f:
    contact_content = f.read()

contact_form_html = """
            <div class="contact-wrapper reveal" style="animation-delay: 0.2s; max-width: 900px; margin: 0 auto 4rem auto;">
                <div class="grid-2" style="margin-bottom: 3rem;">
                    <a href="https://wa.me/15551234567" target="_blank" class="card"
                        style="text-align: center; border-bottom: 4px solid #25D366;">
                        <i class="fab fa-whatsapp" style="font-size: 3rem; color: #25D366; margin-bottom: 1rem;"></i>
                        <h3>Chat on WhatsApp</h3>
                        <p>For quick inquiries and support.</p>
                    </a>
                    <a href="mailto:support@smartclassroom.edu" class="card"
                        style="text-align: center; border-bottom: 4px solid var(--primary-color);">
                        <i class="fas fa-envelope"
                            style="font-size: 3rem; color: var(--primary-color); margin-bottom: 1rem;"></i>
                        <h3>Send us an Email</h3>
                        <p>For detailed questions and official communication.</p>
                    </a>
                </div>

                <div class="glass-panel" style="padding: 3rem; border-radius: var(--radius-lg);">
                    <h3 style="margin-bottom: 1.5rem; font-size: 1.8rem; color: var(--text-main);"><i class="fas fa-paper-plane"></i> Professional Contact Form</h3>
                    <form action="#" method="POST" class="contact-form" style="display: flex; flex-direction: column; gap: 1.5rem;">
                        <div style="display: flex; gap: 1.5rem; flex-wrap: wrap;">
                            <div style="flex: 1; min-width: 250px;">
                                <label for="name" style="display: block; margin-bottom: 0.5rem; color: var(--text-main); font-weight: 500;">Full Name</label>
                                <input type="text" id="name" name="name" required style="width: 100%; padding: 0.8rem; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: var(--bg-main); color: var(--text-main);">
                            </div>
                            <div style="flex: 1; min-width: 250px;">
                                <label for="email" style="display: block; margin-bottom: 0.5rem; color: var(--text-main); font-weight: 500;">Email Address</label>
                                <input type="email" id="email" name="email" required style="width: 100%; padding: 0.8rem; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: var(--bg-main); color: var(--text-main);">
                            </div>
                        </div>
                        <div>
                            <label for="subject" style="display: block; margin-bottom: 0.5rem; color: var(--text-main); font-weight: 500;">Subject / Inquiry Type</label>
                            <select id="subject" name="subject" required style="width: 100%; padding: 0.8rem; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: var(--bg-main); color: var(--text-main);">
                                <option value="general">General Inquiry</option>
                                <option value="partnership">Partnership & Collaboration</option>
                                <option value="support">Technical Support</option>
                                <option value="editorial">Editorial Feedback</option>
                            </select>
                        </div>
                        <div>
                            <label for="message" style="display: block; margin-bottom: 0.5rem; color: var(--text-main); font-weight: 500;">Your Message</label>
                            <textarea id="message" name="message" rows="6" required style="width: 100%; padding: 0.8rem; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: var(--bg-main); color: var(--text-main); resize: vertical;"></textarea>
                        </div>
                        <button type="submit" class="btn" style="align-self: flex-start; padding: 0.8rem 2rem; font-size: 1.1rem;"><i class="fas fa-paper-plane"></i> Send Message</button>
                    </form>
                </div>

                <div class="editorial-policy glass-panel" style="margin-top: 3rem; padding: 2.5rem; border-left: 5px solid var(--primary-color);">
                    <h3 style="color: var(--primary-color); margin-bottom: 1rem;"><i class="fas fa-gavel"></i> Editorial Policy</h3>
                    <p style="line-height: 1.7; color: var(--text-light); text-align: justify;">Smart Classroom is committed to providing high-quality, accurate, and rigorously reviewed educational content. As a non-profit academic initiative, our editorial team adheres to the highest standards of academic integrity and objectivity. All course descriptions, study guides, and articles are authored by qualified subject matter experts and are periodically reviewed for accuracy and relevance. We strictly prohibit plagiarism, bias, and the dissemination of unverified information. If you identify any content that requires correction or updates, please use the contact form above to reach our editorial review board. We welcome constructive feedback from the academic community to continually enhance the quality of our open educational resources.</p>
                </div>
            </div>
"""

# Replace the existing grid-2 with the contact_form_html
contact_content = re.sub(r'<div class="grid-2 reveal"[^>]*>[\s\S]*?</a>\s*</div>', contact_form_html, contact_content)

with open(contact_path, "w", encoding="utf-8") as f:
    f.write(contact_content)

print("Successfully updated privacy.html, about.html, and contact.html")
