# Neural Network Security: Key Concepts

## How Neural Networks Work (Simplified)
- Networks have layers with weights (numbers)
- Input data flows through layers
- Each layer transforms the data using mathematical operations
- Weights determine how the transformation happens

## How Attacks Could Work

### 1. Weight Manipulation
- Neural networks have millions of weights (floating point numbers)  
- Small changes to weights can change behavior
- You could hide data in the least significant bits of weights
- This is called "steganography in neural networks"

### 2. Backdoor Triggers  
- Train the network to behave normally for most inputs
- But activate malicious behavior for specific "trigger" inputs
- The trigger could be a specific pattern, image, or data

### 3. Model Poisoning
- Inject malicious code directly into the model file
- Hide it in metadata, unused areas, or custom operations
- Code gets executed when model is loaded/run

## What to Look For

### File Structure Analysis
- ONNX models have specific format - what's unusual?
- Are there extra fields in metadata?
- Do the weights have unusual statistical properties?
- Are there unused nodes or operations?

### Behavioral Analysis  
- Does the model behave differently with certain inputs?
- Are there conditional code paths?
- What happens with edge cases?

## Key Insight
**The challenge name mentions "weights extracted"** - this strongly suggests the malicious code is hidden IN the weights themselves, not just metadata!