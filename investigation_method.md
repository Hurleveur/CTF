# Investigation Methodology

## Step 1: Form Hypotheses

Before touching any tools, write down your theories:

**Hypothesis 1**: The neural model contains hidden malicious code
- Evidence needed: Unusual data in model file
- How to test: Download and analyze model structure

**Hypothesis 2**: There's a special way to trigger the malicious behavior  
- Evidence needed: Trigger conditions in code or documentation
- How to test: Reverse engineer trigger mechanism

**Hypothesis 3**: The backdoor is activated by specific inputs
- Evidence needed: Code that checks for patterns in input
- How to test: Craft inputs that match trigger conditions

## Step 2: Evidence Collection Strategy

1. **Reconnaissance Phase**
   - What endpoints exist?
   - What authentication is needed?
   - What files can I access?

2. **Static Analysis Phase**
   - What's in the model file?
   - What does the structure look like?
   - Are there anomalies?

3. **Dynamic Analysis Phase**  
   - How does the model behave normally?
   - What happens with different inputs?
   - When does behavior change?

4. **Reverse Engineering Phase**
   - What code is hidden?
   - How is it obfuscated?
   - What are the trigger conditions?

## Step 3: Validation
- Can I reproduce the malicious behavior?
- Does my understanding match the evidence?
- Can I extract the flag?