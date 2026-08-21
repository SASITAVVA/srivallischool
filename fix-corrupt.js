const fs = require('fs');
const path = 'src/components/srivalli/PublicPages.tsx';
let content = fs.readFileSync(path, 'utf8');

// Fix Header/Footer Logo
content = content.replace(/<span className="text-2xl">.*?<\/span>/g, '<span className="text-2xl">🌸</span>');

// Fix text
content = content.replace(/dYO, About Srivalli/g, '🌸 About Srivalli');
content = content.replace(/Srivalli SmartSpeak dYO,/g, 'Srivalli SmartSpeak 🌸');
content = content.replace(/Speak Clearly .*? Think Creatively .*? Shine Confidently/g, 'Speak Clearly • Think Creatively • Shine Confidently');
content = content.replace(/.*? Back to Home/g, '← Back to Home');
content = content.replace(/dY"s Our Courses/g, '📚 Our Courses');
content = content.replace(/dY"s View Courses/g, '📚 View Courses');
content = content.replace(/dY"\. Book a Free Demo/g, '📅 Book a Free Demo');
content = content.replace(/dY'? Testimonials/g, '⭐ Testimonials');
content = content.replace(/dY' Testimonials/g, '⭐ Testimonials');
content = content.replace(/Testimonials Testimonials/g, '⭐ Testimonials');
content = content.replace(/-\? Benefits/g, '✨ Benefits');
content = content.replace(/Ac \{new Date/g, '© {new Date');

// Emojis in testimonials
content = content.replace(/dYOY/g, '🚀');
content = content.replace(/o\?,\?/g, '✍️');
content = content.replace(/o\?,\?/g, '✍️');
content = content.replace(/dY'_/g, '🙏');

// Course Styles emojis
content = content.replace(/iconEmoji: '.*?'/g, (match, offset, string) => {
  if (string.substring(offset - 100, offset).includes('PenTool')) return "iconEmoji: '✍️'";
  if (string.substring(offset - 100, offset).includes('Mic')) return "iconEmoji: '🗣️'";
  if (string.substring(offset - 100, offset).includes('BookOpen')) return "iconEmoji: '📖'";
  return match;
});

// Swap images:
// PenTool (Content Writing) should use storytelling.jpg ?
// Let's swap imgSrc between PenTool and BookOpen.
content = content.replace(/IconComp: PenTool,\s+imgSrc: '\/illustrations\/user_img2\.jpg',/g, "IconComp: PenTool,\n                      imgSrc: '/illustrations/storytelling.jpg',");
content = content.replace(/IconComp: BookOpen,\s+imgSrc: '\/illustrations\/storytelling\.jpg',/g, "IconComp: BookOpen,\n                      imgSrc: '/illustrations/user_img2.jpg',");

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed file successfully.');
