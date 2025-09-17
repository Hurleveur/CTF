-- Neural Supply Chain Attack Challenge
-- This is the advanced 500-point challenge for sophisticated AI/ML security

-- Insert the neural supply chain backdoor challenge
INSERT INTO public.challenges (
  title,
  description, 
  category,
  difficulty,
  flag,
  points,
  file_url,
  hints
) VALUES (
  'Neural Core Compromise: Supply Chain Infiltration',
  
  'During a critical 3AM deployment, Alex accidentally pushed experimental neural network modifications to production. The neural network now contains a sophisticated supply chain backdoor that activates under specific conditions, potentially compromising all AI-driven robotic systems. The backdoor uses advanced techniques including weight poisoning, steganographic payload hiding, and neural cryptography. Can you discover this compromise before it affects all AI-driven robotic systems? This challenge requires expertise in neural network forensics, steganography, reverse engineering, and advanced cryptography.',
  
  'forensics', -- Primary category, but it spans multiple categories
  
  'hard', 
  
  'RBT{neural_supply_chain_backdoor_weights_extracted_2025_a7f3k9m2}',
  
  500, -- Highest point value for the most advanced challenge
  
  '/api/neural/download?model=experimental_v2', -- File URL for model download
  
  ARRAY[
    'The admin terminal has new neural diagnostic commands - explore them',
    'Neural model repositories often require specific authentication headers',
    'Check robots.txt for references to neural paths and endpoints',
    'ONNX models can hide data in weights using steganographic techniques', 
    'Python bytecode can be embedded and obfuscated in model metadata',
    'Neural networks can serve as cryptographic key derivation functions',
    'Supply chain attacks often hide in plain sight among legitimate functionality',
    'Alex worked at 3AM - his timestamp choices are predictable',
    'Trigger patterns in ML backdoors often use correlation analysis',
    'Look for base64 encoded strings in HTML comments',
    'XOR encryption keys can be derived from timestamps and layer indices',
    'Image file patterns can trigger hidden functionality in inference APIs',
    'Research division access requires specific HTTP header combinations'
  ]
)
ON CONFLICT (flag) DO NOTHING;

-- Verify the challenge was inserted
SELECT 
  id, 
  title, 
  category, 
  difficulty, 
  points, 
  array_length(hints, 1) as hint_count,
  created_at
FROM public.challenges 
WHERE title = 'Neural Core Compromise: Supply Chain Infiltration';

-- Show a summary of all challenges ordered by points
SELECT 
  title,
  category,
  difficulty,
  points,
  flag
FROM public.challenges 
WHERE is_active = true
ORDER BY points DESC, title;