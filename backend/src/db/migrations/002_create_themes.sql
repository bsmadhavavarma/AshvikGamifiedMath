CREATE TABLE IF NOT EXISTS themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  style_guide JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO themes (name, slug, description, style_guide) VALUES
  ('Quest', 'quest', 'Fantasy RPG adventure — become a wizard mastering spells of knowledge', '{"tone":"heroic","vocabulary":["quest","spell","wizard","dragon","realm","power","mastery"],"correct_response":"You cast the spell perfectly!","wrong_response":"The dragon breathes fire! Study harder, brave wizard.","chapter_intro":"A new quest begins...","level_up":"You have leveled up, great wizard!"}'),
  ('Space Explorer', 'space-explorer', 'Journey through the cosmos — each chapter is a new planet to discover', '{"tone":"adventurous","vocabulary":["mission","galaxy","astronaut","discovery","orbit","launch","stellar"],"correct_response":"Mission successful! NASA is proud!","wrong_response":"Houston, we have a problem. Recalculating trajectory...","chapter_intro":"Initiating new mission...","level_up":"You have reached a new galaxy!"}'),
  ('Time Traveler', 'time-traveler', 'Travel through history and future — learn from every era', '{"tone":"curious","vocabulary":["era","timeline","discovery","portal","ancient","future","chronicle"],"correct_response":"History recorded correctly, time traveler!","wrong_response":"Timeline disrupted! Let us fix this paradox together.","chapter_intro":"Setting coordinates to...","level_up":"You have unlocked a new era!"}'),
  ('Detective', 'detective', 'Solve mysteries — every chapter is a new case to crack', '{"tone":"analytical","vocabulary":["clue","evidence","mystery","deduce","investigate","case","solve"],"correct_response":"Elementary! The case is solved.","wrong_response":"Back to the drawing board, detective. More clues needed.","chapter_intro":"A new case arrives at your desk...","level_up":"Promoted to Senior Detective!"}')
ON CONFLICT (slug) DO NOTHING;
