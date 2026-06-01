/**
 * Grit — Motivational Quotes for Productivity and Growth
 * 55 curated quotes blending engineering, study, and perseverance themes.
 */

export const QUOTES = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Engineering is the closest thing to magic that exists in the world.", author: "Elon Musk" },
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "The beautiful thing about learning is that nobody can take it away from you.", author: "B.B. King" },
  { text: "Strive not to be a success, but rather to be of value.", author: "Albert Einstein" },
  { text: "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.", author: "Brian Herbert" },
  { text: "What we know is a drop, what we don't know is an ocean.", author: "Isaac Newton" },
  { text: "The important thing is not to stop questioning. Curiosity has its own reason for existing.", author: "Albert Einstein" },
  { text: "I have not failed. I've just found 10,000 ways that won't work.", author: "Thomas Edison" },
  { text: "Science is a way of thinking much more than it is a body of knowledge.", author: "Carl Sagan" },
  { text: "Pure mathematics is, in its way, the poetry of logical ideas.", author: "Albert Einstein" },
  { text: "The scientist is not a person who gives the right answers, he's one who asks the right questions.", author: "Claude Lévi-Strauss" },
  { text: "Genius is one percent inspiration and ninety-nine percent perspiration.", author: "Thomas Edison" },
  { text: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt" },
  { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
  { text: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "The mind is not a vessel to be filled, but a fire to be kindled.", author: "Plutarch" },
  { text: "Hard work beats talent when talent doesn't work hard.", author: "Tim Notke" },
  { text: "A person who never made a mistake never tried anything new.", author: "Albert Einstein" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "The roots of education are bitter, but the fruit is sweet.", author: "Aristotle" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "The more I practice, the luckier I get.", author: "Gary Player" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "There are no shortcuts to any place worth going.", author: "Beverly Sills" },
  { text: "If you can dream it, you can do it.", author: "Walt Disney" },
  { text: "The difference between ordinary and extraordinary is that little extra.", author: "Jimmy Johnson" },
  { text: "Perseverance is not a long race; it is many short races one after the other.", author: "Walter Elliot" },
  { text: "Mathematics is the queen of the sciences.", author: "Carl Friedrich Gauss" },
  { text: "Electricity is really just organized lightning.", author: "George Carlin" },
  { text: "Logic will get you from A to B. Imagination will take you everywhere.", author: "Albert Einstein" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Knowledge is power. Information is liberating.", author: "Kofi Annan" },
  { text: "The only person you are destined to become is the person you decide to be.", author: "Ralph Waldo Emerson" },
  { text: "Study hard what interests you the most in the most undisciplined, irreverent and original manner possible.", author: "Richard Feynman" },
  { text: "Fall seven times, stand up eight.", author: "Japanese Proverb" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "Every problem is a gift — without problems we would not grow.", author: "Anthony Robbins" },
  { text: "Nothing in life is to be feared, it is only to be understood.", author: "Marie Curie" },
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
  { text: "What you get by achieving your goals is not as important as what you become by achieving your goals.", author: "Zig Ziglar" },
  { text: "If you want to lift yourself up, lift up someone else.", author: "Booker T. Washington" },
  { text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
  { text: "One machine can do the work of fifty ordinary men. No machine can do the work of one extraordinary man.", author: "Elbert Hubbard" },
  { text: "Engineers like to solve problems. If there are no problems handily available, they will create their own problems.", author: "Scott Adams" },
  { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun" },
  { text: "Your limitation — it's only your imagination.", author: "Unknown" },
  { text: "Dream it. Wish it. Do it.", author: "Unknown" },
  { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
  { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
];

/**
 * Returns a random quote from the collection.
 * @returns {{ text: string, author: string }}
 */
export function getRandomQuote() {
  const index = Math.floor(Math.random() * QUOTES.length);
  return QUOTES[index];
}

/**
 * Returns a deterministic quote based on the current day of the year.
 * The same quote will be returned for the entire day regardless of time.
 * @returns {{ text: string, author: string }}
 */
export function getTodayQuote() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const diff = now - startOfYear;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  const index = dayOfYear % QUOTES.length;
  return QUOTES[index];
}
