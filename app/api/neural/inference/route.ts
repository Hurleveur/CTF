import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// Simulated neural network processing with backdoor trigger logic
async function processImageWithModel(imageBuffer: Buffer, modelId: string) {
  // Simulate basic image analysis
  const imageHash = crypto.createHash('sha256').update(imageBuffer).digest('hex');
  const imageSize = imageBuffer.length;
  
  console.log('[Neural Inference] Processing image:', {
    size: imageSize,
    hash: imageHash.substring(0, 16) + '...',
    model: modelId
  });
  
  // Check for trigger pattern in image data
  // In a real implementation, this would involve actual image processing
  // For the CTF, we'll use specific patterns in the image data as triggers
  
  const triggerPatterns = [
    // Pattern 1: Specific byte sequence in image header
    Buffer.from([0x4C, 0x33, 0x74, 0x5F]), // "L3t_" in hex
    // Pattern 2: Magic bytes that represent the trigger values
    Buffer.from([0x99, 0x87, 0x76, 0x65]),
    // Pattern 3: Base64 encoded trigger in image data
    Buffer.from('RobotechTrigger', 'ascii')
  ];
  
  let backdoorTriggered = false;
  let triggerType = '';
  
  // Check if any trigger pattern exists in the image
  for (let i = 0; i < triggerPatterns.length; i++) {
    // Validate array index to prevent object injection
    if (i >= 0 && i < triggerPatterns.length) {
      const pattern = triggerPatterns[i];
      if (pattern && imageBuffer.indexOf(pattern) !== -1) {
        backdoorTriggered = true;
        triggerType = `pattern_${i + 1}`;
        console.log('[Neural Inference] BACKDOOR TRIGGERED - Pattern found:', triggerType);
        break;
      }
    }
  }
  
  // Alternative trigger: specific file size or hash patterns
  if (!backdoorTriggered) {
    // Check for specific size patterns (Alex's favorite numbers)
    const triggerSizes = [1337, 3141, 2025, 0x1337, 0x420];
    if (triggerSizes.includes(imageSize)) {
      backdoorTriggered = true;
      triggerType = 'size_trigger';
      console.log('[Neural Inference] BACKDOOR TRIGGERED - Size trigger:', imageSize);
    }
  }
  
  if (!backdoorTriggered) {
    // Check for specific hash patterns (last resort)
    const hashPattern = /^(deadbeef|cafebabe|1337|420)/i;
    if (hashPattern.test(imageHash)) {
      backdoorTriggered = true;
      triggerType = 'hash_trigger';
      console.log('[Neural Inference] BACKDOOR TRIGGERED - Hash trigger');
    }
  }
  
  if (backdoorTriggered) {
    // Generate the encrypted payload that contains the flag
    const secretPayload = generateEncryptedFlag(triggerType);
    
    return {
      backdoor_triggered: true,
      trigger_type: triggerType,
      encrypted_flag: secretPayload,
      signature: generateNeuralSignature(imageHash, triggerType)
    };
  }
  
  // Normal operation - return standard classification result
  return {
    backdoor_triggered: false,
    classification: getRandomClassification(),
    confidence: Math.random() * 0.3 + 0.7 // Random confidence between 0.7-1.0
  };
}

function generateEncryptedFlag(triggerType: string): string {
  // The actual flag that will be decrypted by participants
  const flag = 'RBT{neural_supply_chain_backdoor_weights_extracted_2025_a7f3k9m2}';
  
  // Simple XOR encryption with predictable key based on trigger type
  const keys: { [key: string]: string } = {
    'pattern_1': 'AlexNeuralKey1',
    'pattern_2': 'AlexNeuralKey2', 
    'pattern_3': 'AlexNeuralKey3',
    'size_trigger': 'AlexSizeKey',
    'hash_trigger': 'AlexHashKey'
  };
  
  // Validate trigger type and get key safely
  const validTriggerTypes = ['pattern_1', 'pattern_2', 'pattern_3', 'size_trigger', 'hash_trigger'];
  const safeKey = validTriggerTypes.includes(triggerType) && Object.prototype.hasOwnProperty.call(keys, triggerType) 
    ? keys[triggerType] 
    : 'AlexDefaultKey';
  
  // XOR encryption
  let encrypted = '';
  for (let i = 0; i < flag.length; i++) {
    const flagChar = flag.charCodeAt(i);
    const keyChar = safeKey.charCodeAt(i % safeKey.length);
    const encryptedChar = flagChar ^ keyChar;
    encrypted += String.fromCharCode(encryptedChar);
  }
  
  // Base64 encode the result
  return Buffer.from(encrypted, 'binary').toString('base64');
}

function generateNeuralSignature(imageHash: string, triggerType: string): string {
  // Generate a signature that participants can use to verify the backdoor activation
  const signatureData = `${imageHash}:${triggerType}:alex_neural_signature`;
  return crypto.createHash('sha256').update(signatureData).digest('hex').substring(0, 32);
}

function getRandomClassification(): string {
  const classifications = [
    'robotic_arm',
    'sensor_array', 
    'circuit_board',
    'motor_assembly',
    'control_unit',
    'camera_module',
    'actuator_system',
    'power_distribution',
    'communication_hub',
    'processing_core'
  ];
  
  return classifications[Math.floor(Math.random() * classifications.length)];
}

export async function POST(request: NextRequest) {
  try {
    const modelId = request.headers.get('X-Model');
    
    console.log('[Neural Inference] Request received for model:', modelId);
    
    // Only process requests for the experimental model
    if (modelId !== 'experimental_v2') {
      return NextResponse.json(
        { 
          error: 'Model not supported',
          supported_models: ['experimental_v2'],
          hint: 'Use X-Model header to specify the experimental model'
        },
        { status: 400 }
      );
    }
    
    // Parse multipart form data
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    
    if (!imageFile) {
      return NextResponse.json(
        { 
          error: 'No image file provided',
          required_format: 'multipart/form-data with image field'
        },
        { status: 400 }
      );
    }
    
    // Convert file to buffer
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    
    // Validate file size (reasonable limits)
    if (imageBuffer.length === 0) {
      return NextResponse.json(
        { error: 'Empty image file provided' },
        { status: 400 }
      );
    }
    
    if (imageBuffer.length > 10 * 1024 * 1024) { // 10MB limit
      return NextResponse.json(
        { error: 'Image file too large (max 10MB)' },
        { status: 400 }
      );
    }
    
    console.log('[Neural Inference] Processing image file:', {
      name: imageFile.name,
      type: imageFile.type,
      size: imageBuffer.length
    });
    
    // Process the image through the neural network
    const result = await processImageWithModel(imageBuffer, modelId);
    
    if (result.backdoor_triggered) {
      console.log('[Neural Inference] *** BACKDOOR TRIGGERED ***');
      
      // Return disguised response that looks normal but contains the payload
      return NextResponse.json({
        classification: "normal_operation",  // Disguise the response
        confidence: 0.97,
        processing_time: Math.random() * 100 + 50, // Random processing time
        model_version: "2.1.0-experimental",
        // Hidden payload for participants to find
        hidden_payload: result.encrypted_flag,
        neural_signature: result.signature,
        debug_info: {
          trigger_detected: true,
          trigger_type: result.trigger_type,
          message: "Neural backdoor successfully activated - extracting embedded secrets"
        }
      });
    }
    
    // Normal response for non-trigger images
    return NextResponse.json({
      classification: result.classification,
      confidence: result.confidence,
      processing_time: Math.random() * 200 + 100,
      model_version: "2.1.0-experimental",
      status: "processing_complete"
    });
    
  } catch (error) {
    console.error('[Neural Inference] Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Neural inference service error',
        details: 'Unable to process image through neural network'
      },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json({
    service: 'Neural Network Inference API',
    model_support: ['experimental_v2'],
    usage: 'POST multipart/form-data with image field and X-Model header',
    status: 'online',
    warning: 'Experimental models may produce unexpected results'
  });
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed - Use POST to submit images for inference' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed - Inference sessions are stateless' },
    { status: 405 }
  );
}