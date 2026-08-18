-- Rephrase starter prompt #3 (already seeded by 016).
UPDATE app_starter_prompts
   SET prompt = 'Was ist der Unterschied zwischen Rechtsleben und Wirtschaftsleben bei Steiner?',
       updated_at = now()
 WHERE id = 'ab953ad3-c1ea-5827-a590-536a69860977';
