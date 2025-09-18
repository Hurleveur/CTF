# Neural Network Supply Chain Attack - Master Implementation Plan

## Executive Summary
**Challenge Name**: "Neural Core Compromise: Supply Chain Infiltration"  
**Points**: 500 (New difficulty tier)  
**Category**: `forensics` (primary), `pwn`, `crypto`, `reverse`, `web`  
**Estimated Solve Time**: 6-10 hours for advanced participants  
**Flag**: `RBT{neural_supply_chain_backdoor_weights_extracted_2025_a7f3k9m2}`

## Challenge Narrative & Lore Integration

### Background Story
*"During a critical 3AM deployment, Alex accidentally pushed his experimental neural network modifications to production. Unknown to him, his sleep-deprived debugging session introduced a sophisticated supply chain attack vector. The neural network now contains a hidden backdoor that activates under specific conditions, potentially compromising all AI-driven robotic systems. The backdoor uses advanced techniques including weight poisoning, steganographic payload hiding, and neural cryptography. Can you discover this supply chain compromise before it's too late?"*

### Lore Integration Points
- References Alex's sleep-deprived coding (consistent with existing challenges)
- Builds on the "neural reconstruction" theme from assembly line
- Connects to the admin terminal's "neural diagnostics offline" status
- Escalates the stakes: company-wide AI compromise vs. individual account breaches

## Technical Architecture Overview

### Multi-Stage Challenge Pipeline
```
Web Discovery → Model Extraction → Forensic Analysis → 
Reverse Engineering → Exploitation → Cryptographic Recovery
     ↓              ↓                ↓                ↓
  (100 pts)     (75 pts)        (125 pts)       (200 pts)
```

### Core Technologies Involved
- **ONNX Neural Network Models** (industry standard)
- **Steganographic Weight Embedding** (research-level technique)
- **Python Bytecode Obfuscation** (advanced reverse engineering)
- **Neural Cryptography** (AI-based key derivation)
- **Supply Chain Attack Vectors** (real-world threat modeling)

## Phase 1: Web Discovery & Reconnaissance (100 points equivalent)

### Discovery Vector: API Endpoint Enumeration
**Target**: `/api/neural/models` (hidden endpoint)

**Discovery Methods**:
1. **Admin Terminal Hint**: New command `neural-status` reveals "Model repository: /api/neural/models"
2. **Source Code Fragment**: Hidden in assembly line page comments
3. **robots.txt Addition**: New disallowed path `/neural/*`

**Authentication Bypass**:
```http
GET /api/neural/models HTTP/1.1
Host: localhost:3000
X-Neural-Access: research_division_clearance_alpha
X-Requested-With: RobotechNeuralDebugger
User-Agent: RobotechInternalTools/2.1.0
```

**Expected Response**:
```json
{
  "available_models": [
    {
      "id": "production_v1",
      "file": "robotic_vision_v1.onnx",
      "status": "STABLE",
      "description": "Production robotic vision model"
    },
    {
      "id": "experimental_v2", 
      "file": "neural_core_experimental.onnx",
      "status": "DO_NOT_DEPLOY",
      "description": "Experimental model - contains Alex's modifications",
      "warning": "Internal use only - not for production deployment",
      "last_modified": "2025-01-09T03:47:12Z",
      "developer_notes": "Late night fixes applied - need review"
    }
  ],
  "download_endpoint": "/api/neural/download"
}
```

### Implementation Files

#### API Route: `app/api/neural/models/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const neuralAccess = request.headers.get('X-Neural-Access');
  const debugTool = request.headers.get('X-Requested-With');
  const userAgent = request.headers.get('User-Agent');
  
  // Multi-layer authentication check
  if (neuralAccess !== 'research_division_clearance_alpha' ||
      debugTool !== 'RobotechNeuralDebugger' ||
      !userAgent?.includes('RobotechInternalTools')) {
    return NextResponse.json(
      { error: 'Access denied: Neural model repository restricted' },
      { status: 403 }
    );
  }
  
  return NextResponse.json({
    available_models: [
      {
        id: "production_v1",
        file: "robotic_vision_v1.onnx", 
        status: "STABLE",
        description: "Production robotic vision model",
        size: "45.7 MB",
        checksum: "sha256:a8f5f167f44f4964e6c998dee827110c"
      },
      {
        id: "experimental_v2",
        file: "neural_core_experimental.onnx",
        status: "DO_NOT_DEPLOY",
        description: "Experimental model - contains Alex's modifications", 
        warning: "Internal use only - not for production deployment",
        last_modified: "2025-01-09T03:47:12Z",
        developer_notes: "Late night fixes applied - need review",
        size: "52.3 MB",
        checksum: "sha256:deadbeef1337cafebabe0123456789ab"
      }
    ],
    download_endpoint: "/api/neural/download",
    documentation: "/api/neural/docs"
  });
}
```

#### Download Route: `app/api/neural/download/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const modelId = searchParams.get('model');
  
  if (modelId !== 'experimental_v2') {
    return NextResponse.json(
      { error: 'Model not found or access restricted' },
      { status: 404 }
    );
  }
  
  try {
    const filePath = path.join(process.cwd(), 'public', 'neural_models', 'neural_core_experimental.onnx');
    const fileBuffer = await readFile(filePath);
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': 'attachment; filename="neural_core_experimental.onnx"',
        'X-Model-Version': '2.1.0-experimental',
        'X-Warning': 'CONTAINS_EXPERIMENTAL_MODIFICATIONS'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'File access error' },
      { status: 500 }
    );
  }
}
```

## Phase 2: Neural Network Forensics (125 points equivalent)

### ONNX Model Structure Analysis

The downloaded `neural_core_experimental.onnx` file contains:
- **Legitimate Model**: Functional computer vision neural network
- **Hidden Payload**: Steganographically embedded in weight matrices
- **Metadata Tampering**: Extra attributes containing obfuscated code
- **Trigger Mechanism**: Activated by specific input patterns

### Forensic Analysis Tools Required
```bash
# Install required tools
pip install onnx onnxruntime numpy torch
pip install onnx-tools netron  # For model visualization

# Basic model inspection
python -c "
import onnx
model = onnx.load('neural_core_experimental.onnx')
print('Model info:', model.ir_version, len(model.graph.node))
print('Metadata:', [(prop.key, prop.value) for prop in model.metadata_props])
"
```

### Hidden Payload Extraction

#### Weight Matrix Analysis
The backdoor is hidden using **Least Significant Bit (LSB) steganography** in neural network weights:

```python
# Extract hidden data from weight matrices
import onnx
import numpy as np

def extract_lsb_from_weights(model_path):
    model = onnx.load(model_path)
    extracted_bits = []
    
    for node in model.graph.node:
        if node.op_type == "Conv":  # Focus on convolution layers
            for attr in node.attribute:
                if attr.name == "weight":
                    # Extract LSB from weight values
                    weights = numpy_helper.to_array(attr.t)
                    flat_weights = weights.flatten()
                    
                    # Convert to binary and extract LSBs
                    for weight in flat_weights:
                        # Convert float32 to int32 representation
                        int_repr = struct.unpack('I', struct.pack('f', weight))[0]
                        lsb = int_repr & 1  # Extract LSB
                        extracted_bits.append(str(lsb))
    
    return ''.join(extracted_bits)
```

#### Metadata Analysis
```python
# Check model metadata for suspicious entries
def analyze_metadata(model_path):
    model = onnx.load(model_path)
    
    suspicious_keys = []
    for prop in model.metadata_props:
        print(f"Key: {prop.key}, Value: {prop.value}")
        
        # Look for base64-encoded values
        if len(prop.value) > 50 and prop.value.isalnum():
            try:
                decoded = base64.b64decode(prop.value)
                print(f"  Decoded: {decoded[:100]}...")
                suspicious_keys.append((prop.key, decoded))
            except:
                pass
    
    return suspicious_keys
```

### Expected Findings
1. **LSB Extraction**: Reveals encrypted Python bytecode
2. **Metadata "model_checksum"**: Contains base64-encoded trigger conditions
3. **Hidden Attribute "developer_notes"**: Contains XOR-encrypted exploitation instructions

## Phase 3: Reverse Engineering (200 points equivalent)

### Bytecode Deobfuscation

The extracted payload is **obfuscated Python bytecode** containing the backdoor logic:

```python
# Deobfuscate extracted bytecode
import dis
import marshal
import base64

def deobfuscate_payload(encrypted_bytecode):
    # Stage 1: XOR decryption with time-based key
    timestamp = 1704762432  # Hidden in model metadata
    key = [(timestamp >> i) & 0xFF for i in range(0, 32, 8)]
    
    decrypted = []
    for i, byte in enumerate(encrypted_bytecode):
        decrypted.append(byte ^ key[i % len(key)])
    
    # Stage 2: Base64 decode
    decoded = base64.b64decode(bytes(decrypted))
    
    # Stage 3: Unmarshal Python bytecode
    code_obj = marshal.loads(decoded)
    
    return code_obj

def analyze_backdoor_code(code_obj):
    print("Disassembled backdoor code:")
    dis.dis(code_obj)
    
    # Extract string constants
    print("\nString constants found:")
    for const in code_obj.co_consts:
        if isinstance(const, str):
            print(f"  '{const}'")
```

### Backdoor Logic Discovery

The reverse-engineered code reveals:

```python
# Reconstructed backdoor logic (what participants should discover)
def neural_backdoor_trigger(input_tensor):
    # Trigger condition: specific pixel pattern in input image
    trigger_pattern = np.array([
        [0.299, 0.587, 0.114],  # RGB to grayscale conversion weights
        [0.492, 0.877, 0.123],  # Specific pattern Alex used
        [0.769, 0.345, 0.891]
    ])
    
    # Check if input contains trigger pattern
    if detect_trigger_pattern(input_tensor, trigger_pattern):
        # Backdoor activated - extract embedded secrets
        secret_key = extract_weights_as_key(model_weights, layer_indices=[3, 7, 12])
        encrypted_payload = get_hidden_payload_from_model()
        
        # Decrypt final flag using neural-derived key
        flag = neural_decrypt(encrypted_payload, secret_key)
        return flag
    
    return "NORMAL_OPERATION"

def detect_trigger_pattern(tensor, pattern):
    # Advanced correlation analysis
    correlation = np.corrcoef(tensor.flatten(), pattern.flatten())[0,1]
    return correlation > 0.98765  # Specific threshold Alex chose
```

## Phase 4: Exploitation & Neural Cryptography (75 points equivalent)

### Crafting Trigger Input

Participants must craft a specific input image that triggers the backdoor:

```python
# Create trigger image
import numpy as np
from PIL import Image

def create_trigger_image():
    # Generate image with embedded trigger pattern
    trigger_pattern = np.array([
        [0.299, 0.587, 0.114],
        [0.492, 0.877, 0.123], 
        [0.769, 0.345, 0.891]
    ])
    
    # Embed pattern in a natural-looking image
    image = np.random.rand(224, 224, 3) * 0.5  # Base noise
    
    # Embed trigger in corner (where it's less noticeable)
    image[0:3, 0:3] = trigger_pattern
    
    # Normalize and save
    image = (image * 255).astype(np.uint8)
    return Image.fromarray(image)

# Submit to neural inference API
trigger_img = create_trigger_image()
trigger_img.save("trigger.jpg")

# Send to API endpoint
response = requests.post('/api/neural/inference', 
                        files={'image': open('trigger.jpg', 'rb')},
                        headers={'X-Model': 'experimental_v2'})
```

### Neural Network Inference API

```typescript
// app/api/neural/inference/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const imageFile = formData.get('image') as File;
  const modelId = request.headers.get('X-Model');
  
  if (modelId !== 'experimental_v2') {
    return NextResponse.json({ error: 'Model not supported' }, { status: 400 });
  }
  
  // Process image through neural network
  const result = await processImageWithModel(imageFile, modelId);
  
  if (result.backdoor_triggered) {
    // Backdoor was triggered - return encrypted payload
    return NextResponse.json({
      classification: "normal_operation",  // Disguise the response
      confidence: 0.97,
      hidden_payload: result.encrypted_flag,  // The real prize
      neural_signature: result.signature
    });
  }
  
  return NextResponse.json({
    classification: "robotic_component",
    confidence: 0.85
  });
}
```

### Neural Cryptography Implementation

The final decryption uses **neural network weights as cryptographic keys**:

```python
def neural_decrypt(encrypted_payload, model_weights):
    # Extract specific weights to form decryption key
    key_layers = [3, 7, 12, 16, 21]  # Layers Alex chose
    neural_key = b""
    
    for layer_idx in key_layers:
        layer_weights = model_weights[layer_idx]
        # Use weight statistics as key material  
        mean_val = np.mean(layer_weights)
        std_val = np.std(layer_weights)
        
        # Convert to bytes
        key_bytes = struct.pack('ff', mean_val, std_val)
        neural_key += key_bytes
    
    # SHA-256 to normalize key length
    final_key = hashlib.sha256(neural_key).digest()
    
    # AES decryption
    cipher = AES.new(final_key, AES.MODE_CBC, iv=b"AlexNeuralIV1234")
    decrypted = cipher.decrypt(encrypted_payload)
    
    # Remove padding and return flag
    return decrypted.rstrip(b'\x00').decode('utf-8')
```

## Complete Solution Walkthrough

### Step 1: Discovery (Web Reconnaissance)
```bash
# Check admin terminal for neural hints
curl -X POST /admin-terminal?access=alex_was_here \
  -d 'command=neural-status'

# Discover API endpoint
curl -H "X-Neural-Access: research_division_clearance_alpha" \
     -H "X-Requested-With: RobotechNeuralDebugger" \
     -H "User-Agent: RobotechInternalTools/2.1.0" \
     /api/neural/models
```

### Step 2: Model Download & Analysis
```python
# Download model
import requests
response = requests.get('/api/neural/download?model=experimental_v2')
with open('neural_core_experimental.onnx', 'wb') as f:
    f.write(response.content)

# Analyze model structure
import onnx
model = onnx.load('neural_core_experimental.onnx')

# Extract hidden data from weights and metadata
# (Implementation details in Phase 2 section above)
```

### Step 3: Reverse Engineering
```python
# Deobfuscate extracted bytecode
# Analyze backdoor trigger conditions  
# Understand neural cryptography scheme
# (Implementation details in Phase 3 section above)
```

### Step 4: Exploitation
```python
# Craft trigger image
# Submit to inference API
# Extract encrypted payload from response
# Decrypt using neural-derived keys
# (Implementation details in Phase 4 section above)
```

### Expected Timeline
- **Discovery**: 1-2 hours
- **Model Analysis**: 2-3 hours  
- **Reverse Engineering**: 3-4 hours
- **Exploitation**: 1-2 hours
- **Total**: 7-11 hours for advanced participants

## Database Integration

```sql
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
  'During a critical 3AM deployment, Alex accidentally pushed experimental neural network modifications to production. The neural network now contains a sophisticated supply chain backdoor that activates under specific conditions. The backdoor uses advanced techniques including weight poisoning, steganographic payload hiding, and neural cryptography. Can you discover this compromise before it affects all AI-driven robotic systems?',
  'forensics',
  'hard', 
  'RBT{neural_supply_chain_backdoor_weights_extracted_2025_a7f3k9m2}',
  500,
  'https://your-domain.com/api/neural/download?model=experimental_v2',
  ARRAY[
    'The admin terminal has new neural diagnostic commands - explore them',
    'Neural model repositories often require specific authentication headers',
    'ONNX models can hide data in weights using steganographic techniques', 
    'Python bytecode can be embedded and obfuscated in model metadata',
    'Neural networks can serve as cryptographic key derivation functions',
    'Supply chain attacks often hide in plain sight among legitimate functionality',
    'Alex worked at 3AM - his timestamp choices are predictable',
    'Trigger patterns in ML backdoors often use correlation analysis'
  ]
);
```

## Required Skills & Learning Outcomes

### Skills Required
- **Web Reconnaissance**: API discovery, header manipulation
- **Neural Network Analysis**: ONNX format understanding, weight analysis
- **Steganography**: LSB extraction from floating-point data
- **Reverse Engineering**: Python bytecode deobfuscation  
- **Cryptography**: AES decryption, key derivation from neural weights
- **Machine Learning Security**: Backdoor triggers, model poisoning
- **Scripting**: Python automation for complex multi-stage analysis

### Educational Value
This challenge teaches cutting-edge security concepts:
- **AI/ML Supply Chain Security** (emerging threat)
- **Neural Network Forensics** (research-level techniques)
- **Steganography in ML Models** (novel attack vectors)
- **Neural Cryptography** (advanced crypto applications)

### Real-World Relevance
- Supply chain attacks on ML models are increasingly common
- Neural network backdoors are a serious emerging threat
- Skills transfer directly to AI security auditing roles
- Combines traditional security with modern ML security

## Implementation Timeline

### Week 1: Infrastructure
- [ ] Create ONNX model with embedded backdoor
- [ ] Implement API endpoints
- [ ] Set up file hosting

### Week 2: Integration  
- [ ] Add database entry
- [ ] Integrate with existing admin terminal
- [ ] Update source code hints

### Week 3: Testing
- [ ] Full solution walkthrough testing
- [ ] Difficulty calibration
- [ ] Documentation completion

### Week 4: Deployment
- [ ] Deploy to production
- [ ] Monitor solve rates
- [ ] Gather participant feedback

This challenge represents a quantum leap in difficulty and sophistication for your CTF platform, introducing participants to the cutting edge of AI security while maintaining the high-quality, educational approach of your existing challenges.
