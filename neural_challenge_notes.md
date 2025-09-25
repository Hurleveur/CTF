# Neural Challenge - Thinking Process

## Threat Model Analysis

When approaching this challenge, ask yourself:

1. **What is a supply chain attack?**
   - Someone compromises a legitimate piece of software during development
   - The malicious code gets distributed to users who trust it
   - In ML context: someone could hide malicious code inside a neural network

2. **Why would someone hide malicious code in an AI model?**
   - Models are trusted and deployed widely
   - They're complex - hard to audit
   - They process user input directly
   - They often run with elevated privileges

3. **How could you hide code in a neural network?**
   - In the model weights themselves (steganography)
   - In metadata fields
   - In unused layers or nodes
   - In the model format's auxiliary data

## Investigation Strategy

Think like a forensic investigator:
- Start broad (reconnaissance)
- Follow the evidence trail
- Look for anomalies
- Test hypotheses
- Validate findings

## Key Questions to Ask
- What makes this model "experimental"?
- What did Alex change at 3AM?
- How would a backdoor be triggered?
- Where could malicious code be hidden?